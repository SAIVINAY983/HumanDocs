const Document = require('../models/Document');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.createDocument = async (req, res) => {
    try {
        const { title, documentContent } = req.body;
        // Stringify content if it's an object, as the schema is now String-based
        const serializedContent = typeof documentContent === 'string' ? documentContent : JSON.stringify(documentContent || {});
        
        const doc = await Document.create({ 
            owner: req.user.id,
            title: title || 'Untitled Document',
            documentContent: serializedContent
        });
        res.status(201).json(doc);
    } catch (err) {
        console.error('Create document error:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.getDocuments = async (req, res) => {
    try {
        const docs = await Document.find({
            $or: [
                { owner: req.user.id },
                { 'collaborators.user': req.user.id }
            ]
        }).populate('owner', 'name email').sort({ updatedAt: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getDocumentById = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id)
            .select('+password')
            .populate('owner', 'name email')
            .populate('collaborators.user', 'name email');
        
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        
        const isOwner = doc.owner?._id?.toString() === req.user.id;
        const isCollaborator = doc.collaborators?.some(c => c.user?._id?.toString() === req.user.id);
        const hasPublicAccess = doc.publicAccess !== 'none';
        
        if (!isOwner && !isCollaborator && !hasPublicAccess) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        let role = 'viewer';
        if (isOwner) {
            role = 'owner';
        } else if (isCollaborator) {
            const collab = doc.collaborators.find(c => c.user?._id?.toString() === req.user.id);
            role = collab ? collab.role : 'viewer';
        } else if (hasPublicAccess) {
            role = doc.publicAccess;
        }

        const docObj = doc.toObject();
        const isPasswordProtected = !!docObj.password;
        delete docObj.password;

        res.json({ 
            ...docObj, 
            userRole: role,
            isPasswordProtected
        });
    } catch (err) {
        console.error('Error in getDocumentById:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.updateDocument = async (req, res) => {
    try {
        const { title, documentContent, publicAccess, password } = req.body;
        const doc = await Document.findById(req.params.id);
        
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        
        const isOwner = doc.owner.toString() === req.user.id;
        const isEditor = doc.collaborators.some(c => c.user.toString() === req.user.id && c.role === 'editor');
        const canPublicEdit = doc.publicAccess === 'editor';

        if (!isOwner && !isEditor && !canPublicEdit) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        if (title !== undefined) doc.title = title;
        if (documentContent !== undefined) {
             doc.documentContent = typeof documentContent === 'string' ? documentContent : JSON.stringify(documentContent);
        }
        if (publicAccess !== undefined && isOwner) doc.publicAccess = publicAccess;

        if (password !== undefined && isOwner) {
            if (password === "") {
                doc.password = undefined;
            } else {
                const salt = await bcrypt.genSalt(10);
                doc.password = await bcrypt.hash(password, salt);
            }
        }

        await doc.save();
        res.json(doc);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        if (doc.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only owners can delete documents' });
        }
        await doc.deleteOne();
        res.json({ message: 'Document deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addCollaborator = async (req, res) => {
    try {
        const { email, role } = req.body;
        const userToAdd = await User.findOne({ email });
        
        if (!userToAdd) return res.status(404).json({ message: 'User not found' });
        
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        
        if (doc.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only owners can add collaborators' });
        }
        
        const exists = doc.collaborators.some(c => c.user.toString() === userToAdd._id.toString());
        if (exists) return res.status(400).json({ message: 'User is already a collaborator' });
        if (userToAdd._id.toString() === doc.owner.toString()) {
            return res.status(400).json({ message: 'Owner cannot be added as a collaborator' });
        }

        doc.collaborators.push({ user: userToAdd._id, role: role || 'viewer' });
        await doc.save();
        
        res.json({ message: 'Collaborator added successfully', collaborator: { id: userToAdd._id, name: userToAdd.name, email: userToAdd.email, role } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.saveVersion = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        
        const isOwner = doc.owner.toString() === req.user.id;
        const isEditor = doc.collaborators.some(c => c.user.toString() === req.user.id && c.role === 'editor');
        
        if (!isOwner && !isEditor) {
            return res.status(403).json({ message: 'Permission denied' });
        }

        doc.versions.push({
            documentContent: doc.documentContent,
            user: req.user.id
        });
        
        if (doc.versions.length > 20) {
            doc.versions.shift();
        }

        await doc.save();
        res.json({ message: 'Version saved successfully', versions: doc.versions });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getVersions = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id).populate('versions.user', 'name email');
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        res.json(doc.versions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.verifyDocumentPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const doc = await Document.findById(req.params.id).select('+password');
        
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        if (!doc.password) return res.status(400).json({ message: 'Document is not password protected' });

        const isMatch = await bcrypt.compare(password, doc.password);
        if (isMatch) {
            res.json({ message: 'Password verified' });
        } else {
            res.status(401).json({ message: 'Incorrect password' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
