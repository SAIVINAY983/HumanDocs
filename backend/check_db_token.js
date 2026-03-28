const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function checkToken() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'billakantisaivinay943@gmail.com' });
    if (user) {
        console.log('JSON_START');
        console.log(JSON.stringify({
            token: user.resetPasswordToken,
            expires: user.resetPasswordExpires,
            now: new Date()
        }, null, 2));
        console.log('JSON_END');
    }
    await mongoose.connection.close();
}

checkToken();
