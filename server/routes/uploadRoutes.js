const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const { uploadFile } = require('../controllers/fileController');

// Upload route - protected and handles multiple files
router.post('/', protect, upload.array('files', 5), uploadFile);

module.exports = router;
