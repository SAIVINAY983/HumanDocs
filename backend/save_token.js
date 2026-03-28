const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const fs = require('fs');

async function checkToken() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'billakantisaivinay943@gmail.com' });
    if (user && user.resetPasswordToken) {
        fs.writeFileSync('token.txt', user.resetPasswordToken);
        console.log('Token written to token.txt');
    } else {
        console.log('No token found');
    }
    await mongoose.connection.close();
}

checkToken();
