import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup, googleAuth } from '../api/api';
import { FileText, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';

const Signup = ({ onSignup }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
             // Check for placeholder
             const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";
             if (clientId.includes("YOUR_GOOGLE_CLIENT_ID_HERE")) {
                 setError('Google Client ID is missing. Please replace the placeholder in src/main.jsx with your real ID from Google Cloud Console.');
                 setLoading(false);
                 return;
             }
            try {
                setLoading(true);
                const res = await googleAuth({ token: tokenResponse.access_token });
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                if (onSignup) onSignup();
                navigate('/dashboard');
            } catch (err) {
                setError(err.response?.data?.message || 'Google Signup Failed');
                setLoading(false);
            }
        },
        onError: (errorResponse) => {
            console.error('Google OAuth Popup Error:', errorResponse);
            setError('Google Signup Failed: ' + (errorResponse?.error_description || errorResponse?.error || 'Popup closed or access denied.'));
            setLoading(false);
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError('Please enter a valid email address format.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await signup(formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            if (onSignup) onSignup();
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Error signing up');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-brand-surface">
            {/* Left Side: Visual/Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-premium p-12 flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="p-2 bg-white/20 backdrop-blur-lg rounded-xl border border-white/30 shadow-lg">
                            <FileText className="text-white w-8 h-8" />
                        </div>
                        <span className="text-3xl font-black text-white tracking-tighter">HumanDocs</span>
                    </div>
                    
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-6xl font-black text-white leading-none mb-10">
                            Start your <br />
                            <span className="text-rose-200 italic underline decoration-rose-300/50 underline-offset-8">creative</span> journey.
                        </h2>
                        <ul className="space-y-8">
                            {[
                                'Real-time multi-user editing',
                                'AI-powered writing assistance',
                                'Secure document versioning',
                                'Professional PDF exporting'
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-5 text-indigo-50/90 text-xl font-medium">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-black shadow-lg">✓</div>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                <div className="relative z-10 p-10 glass rounded-[2rem] border border-white/40">
                    <p className="text-indigo-950 font-black text-xl mb-4 leading-relaxed italic">"This is hands down the best collaboration tool I've used. The AI integration is life-changing."</p>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 shadow-xl border-4 border-white/30" />
                        <div>
                            <span className="text-lg font-black text-indigo-900 block leading-none">Sarah Chen</span>
                            <span className="text-sm font-bold text-indigo-600/70 uppercase tracking-widest">Creative Director</span>
                        </div>
                    </div>
                </div>

                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-400/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            </div>

            {/* Right Side: Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-12 lg:hidden flex flex-col items-center">
                        <div className="p-4 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl mb-4 shadow-xl shadow-indigo-100">
                            <FileText className="text-white w-10 h-10" />
                        </div>
                        <span className="text-2xl font-black text-brand-text tracking-tight">HumanDocs</span>
                    </div>

                    <div className="mb-12 text-center lg:text-left">
                        <h1 className="text-5xl font-black text-brand-text mb-4 tracking-tight">Create Account</h1>
                        <p className="text-gray-500 text-lg font-medium">Join thousands of writers today.</p>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mb-8 p-5 bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl text-sm font-bold shadow-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-gray-700 ml-1 uppercase tracking-widest">Full Name</label>
                            <input 
                                type="text" 
                                name="name"
                                id="name"
                                autoComplete="name"
                                required
                                className="w-full px-6 py-5 rounded-3xl bg-white border-2 border-gray-100 focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 shadow-sm"
                                placeholder="John Doe"
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-gray-700 ml-1 uppercase tracking-widest">Email Address</label>
                            <div className="relative group">
                                <input 
                                    type="email" 
                                    name="email"
                                    id="email"
                                    autoComplete="username"
                                    required
                                    className={`w-full px-6 py-5 rounded-3xl bg-white border-2 outline-none transition-all font-bold text-gray-700 shadow-sm ${
                                        formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                                        : 'border-gray-100 focus:border-brand-primary focus:ring-brand-primary/5'
                                    }`}
                                    placeholder="name@company.com"
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                                {formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                                    <p className="absolute -bottom-5 left-4 text-[10px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                                        Invalid email format
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-gray-700 ml-1 uppercase tracking-widest">Password</label>
                            <div className="relative group">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password"
                                    id="password"
                                    autoComplete="new-password"
                                    required
                                    className="w-full px-6 py-5 rounded-3xl bg-white border-2 border-gray-100 focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 shadow-sm pr-16"
                                    placeholder="••••••••"
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-brand-primary transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 bg-brand-text text-white rounded-3xl font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-black transition-all hover:translate-y-[-2px] active:translate-y-[0px] flex items-center justify-center gap-4 group mt-4"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <span>Get Started</span>
                                    <div className="p-1.5 bg-white/10 rounded-xl group-hover:bg-brand-primary group-hover:rotate-12 transition-all">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                </>
                            )}
                        </button>

                        <div className="relative flex items-center py-4">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-bold uppercase tracking-widest">or continue with</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        <button 
                            type="button"
                            onClick={() => loginWithGoogle()}
                            className="w-full py-5 bg-white border-2 border-gray-100 text-gray-700 rounded-3xl font-black text-lg shadow-sm hover:border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-4 group"
                        >
                            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>Google</span>
                        </button>
                    </form>

                    <p className="mt-12 text-center text-lg font-bold text-gray-400">
                        Already have an account? <Link to="/login" className="text-brand-primary font-black hover:text-indigo-700 underline underline-offset-8 decoration-4 decoration-brand-primary/30 hover:decoration-brand-primary transition-all">Sign In</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Signup;
