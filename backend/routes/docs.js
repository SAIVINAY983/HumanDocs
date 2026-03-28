const express = require('express');
const router = express.Router();
const docController = require('../controllers/docController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', docController.createDocument);
router.get('/', docController.getDocuments);
router.get('/:id', docController.getDocumentById);
router.put('/:id', docController.updateDocument);
router.delete('/:id', docController.deleteDocument);
router.post('/:id/share', docController.addCollaborator);
router.post('/:id/verify-password', docController.verifyDocumentPassword);
router.post('/:id/version', docController.saveVersion);
router.get('/:id/versions', docController.getVersions);

module.exports = router;
