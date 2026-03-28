const mongoose = require('mongoose');
const Document = require('./models/Document');
require('dotenv').config();

async function testMongoose() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const testContent = { ops: [{ insert: 'Direct Mongoose Test\n' }] };
        const doc = await Document.create({
            owner: new mongoose.Types.ObjectId(), // Fake owner
            title: 'Mongoose Test',
            documentContent: testContent
        });

        console.log('Created doc id:', doc._id);
        const docObj = doc.toObject();
        console.log('Doc toObject() keys:', Object.keys(docObj));
        console.log('Doc documentContent in toObject:', JSON.stringify(docObj.documentContent));

        const fetched = await Document.findById(doc._id);
        const fetchedObj = fetched.toObject();
        console.log('Fetched toObject() documentContent:', JSON.stringify(fetchedObj.documentContent));

        if (fetchedObj.documentContent && fetchedObj.documentContent.ops) {
            console.log('SUCCESS: Content stored in DB.');
        } else {
            console.log('FAILURE: Content not found in DB.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Test failed:', err);
    }
}

testMongoose();
