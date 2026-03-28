const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const validator = require('validator');
const { OAuth2Client } = require('google-auth-library');

const validateEmail = (email) => {
    return validator.isEmail(String(email));
};

const sendResetEmail = async (email, token) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
        from: `"HumanDocs Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Reset Your HumanDocs Master Key',
        html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 20px;">
                <h2 style="color: #6366f1; font-weight: 900; tracking-tight: -0.05em;">HumanDocs</h2>
                <p style="font-size: 16px; color: #4b5563; line-height: 1.6;">You've requested a password reset for your workspace. Click the button below to set a new master key. This link expires in 1 hour.</p>
                <a href="${resetUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; margin-top: 20px;">Reset Master Key</a>
                <p style="font-size: 12px; color: #9ca3af; margin-top: 40px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const user = new User({ name, email, password });
        await user.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: user._id, name, email } });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!validateEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();
        
        console.log(`Starting email send to: ${email}`);
        try {
            await sendResetEmail(email, resetToken);
            console.log('Email sent successfully');
        } catch (mailErr) {
            console.error('Mail sending failed:', mailErr);
            throw mailErr;
        }

        res.json({ 
            message: 'A recovery email has been sent to your inbox.',
            debugToken: resetToken
        });
    } catch (err) {
        console.error('Email Error:', err);
        res.status(500).json({ message: 'Failed to send recovery email. Please try again later.' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: 'Password reset token is invalid or has expired' });

        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;
        
        // Fetch user profile using access token
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch user profile from Google');
        }

        const payload = await response.json();

        if (!payload.email) {
            return res.status(400).json({ message: 'Invalid Google token structure' });
        }

        let user = await User.findOne({ email: payload.email });
        
        if (!user) {
            // Auto-signup logic
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            
            user = new User({
                name: payload.name || 'Google User',
                email: payload.email,
                password: hashedPassword
            });
            await user.save();
        }

        const jwtToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token: jwtToken,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error('Google auth error:', err);
        res.status(500).json({ message: 'Google authentication failed' });
    }
};
