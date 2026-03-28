const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    title: { type: String, default: 'Untitled Document' },
    documentContent: { type: String, default: '{}' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    publicAccess: { type: String, enum: ['none', 'viewer', 'editor'], default: 'none' },
    versions: [{
        documentContent: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    collaborators: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['viewer', 'editor'], default: 'viewer' }
    }],
    password: { type: String, select: false }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
