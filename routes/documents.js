const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const documentController = require('../controllers/documentController');

router.use(protect);

router.post('/', upload.single('file'), documentController.uploadDocument);
router.get('/my', documentController.getMyDocuments);
router.get('/stats', authorize('admin', 'hr'), documentController.getDocumentStats);
router.get('/', documentController.getAllDocuments);
router.get('/:id', documentController.getDocument);
router.get('/:id/download', documentController.downloadDocument);
router.delete('/:id', authorize('admin', 'hr'), documentController.deleteDocument);

module.exports = router;
