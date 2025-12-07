const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Poster upload configuration
const posterStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const posterFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only images, PDFs, and PPTs are allowed'), false);
    }
};

const upload = multer({ storage: posterStorage, fileFilter: posterFileFilter });

// Attendance sheet upload configuration
const attendanceDir = 'uploads/attendance';
if (!fs.existsSync(attendanceDir)) {
    fs.mkdirSync(attendanceDir, { recursive: true });
}

const attendanceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, attendanceDir);
    },
    filename: (req, file, cb) => {
        const eventId = req.params.id;
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `attendance_${eventId}_${timestamp}${ext}`);
    }
});

const attendanceFileFilter = (req, file, cb) => {
    const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const allowedExtensions = ['.csv', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only CSV and Excel files (.csv, .xls, .xlsx) are allowed'), false);
    }
};

const uploadAttendance = multer({
    storage: attendanceStorage,
    fileFilter: attendanceFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Proof photos upload configuration
const proofPhotosDir = 'uploads/proof-photos';
if (!fs.existsSync(proofPhotosDir)) {
    fs.mkdirSync(proofPhotosDir, { recursive: true });
}

const proofPhotosStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, proofPhotosDir);
    },
    filename: (req, file, cb) => {
        const eventId = req.params.id;
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 10000);
        const ext = path.extname(file.originalname);
        cb(null, `proof_${eventId}_${timestamp}_${randomNum}${ext}`);
    }
});

const proofPhotosFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG and PNG images are allowed'), false);
    }
};

const uploadProofPhotos = multer({
    storage: proofPhotosStorage,
    fileFilter: proofPhotosFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 5 // Max 5 files
    }
});

module.exports = upload;
module.exports.uploadAttendance = uploadAttendance;
module.exports.uploadProofPhotos = uploadProofPhotos;
