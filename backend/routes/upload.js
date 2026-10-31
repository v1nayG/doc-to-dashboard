const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const { uploadDocument, uploadDocuments, uploadDocumentsAsync } = require('../controllers/uploadController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ['.pdf', '.xlsx', '.xls', '.csv', '.txt', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type. Please upload PDF, Excel, or CSV files.'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024, files: 5 }
});

const handleUploadError = (middleware, field) => (req, res, next) => {
    middleware(req, res, error => {
        if (!error) return next();
        const message = error.code === 'LIMIT_UNEXPECTED_FILE'
            ? `Upload accepts at most 5 files in the ${field} field.`
            : error.message;
        res.status(400).json({ error: message });
    });
};

router.post('/', protect, handleUploadError(upload.single('document'), 'document'), uploadDocument);
router.post('/batch', protect, handleUploadError(upload.array('documents', 5), 'documents'), uploadDocuments);
router.post('/async', protect, handleUploadError(upload.array('documents', 5), 'documents'), uploadDocumentsAsync);

module.exports = router;
