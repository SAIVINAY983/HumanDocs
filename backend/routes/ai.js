const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/summarize', aiController.summarizeText);
router.post('/improve', aiController.improveWriting);
router.post('/fix', aiController.fixGrammar);

module.exports = router;
