const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');
const ApiError = require('./ApiError');
const httpStatus = require('http-status');

// Ensure upload directory exists
const ensureUploadsDir = () => {
  if (!fs.existsSync(config.uploads.dir)) {
    fs.mkdirSync(config.uploads.dir, { recursive: true });
  }
};

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadsDir();
    cb(null, config.uploads.dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (config.uploads.allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid file type. Only ${config.uploads.allowedFileTypes.join(
          ', '
        )} are allowed.`,
        true
      ),
      false
    );
  }
};

// Initialize multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.uploads.maxFileSize,
  },
});

// Middleware for handling single file upload
const uploadSingle = (fieldName) => (req, res, next) => {
  const uploadSingle = upload.single(fieldName);
  
  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new ApiError(
            httpStatus.BAD_REQUEST,
            `File too large. Max size is ${config.uploads.maxFileSize / (1024 * 1024)}MB`,
            true
          )
        );
      }
      return next(err);
    }
    
    if (req.file) {
      // Add file path to request object for further processing
      req.file.path = path.relative(process.cwd(), req.file.path);
    }
    
    next();
  });
};

// Middleware for handling multiple file uploads
const uploadMultiple = (fieldName, maxCount = 5) => (req, res, next) => {
  const uploadMultiple = upload.array(fieldName, maxCount);
  
  uploadMultiple(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(
          new ApiError(
            httpStatus.BAD_REQUEST,
            `One or more files are too large. Max size is ${config.uploads.maxFileSize / (1024 * 1024)}MB per file`,
            true
          )
        );
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(
          new ApiError(
            httpStatus.BAD_REQUEST,
            `Too many files. Maximum ${maxCount} files allowed.`,
            true
          )
        );
      }
      return next(err);
    }
    
    if (req.files && req.files.length > 0) {
      // Add file paths to request object for further processing
      req.files = req.files.map(file => ({
        ...file,
        path: path.relative(process.cwd(), file.path)
      }));
    }
    
    next();
  });
};

// Delete file utility
const deleteFile = (filePath) => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      return true;
    } catch (err) {
      console.error(`Error deleting file ${filePath}:`, err);
      return false;
    }
  }
  return false;
};

// Generate file URL
const getFileUrl = (filePath) => {
  if (!filePath) return null;
  
  // In production, you might want to use a CDN URL
  if (config.isProduction) {
    return `${process.env.APP_URL || 'https://your-app.com'}/uploads/${path.basename(filePath)}`;
  }
  
  // In development, use the local server URL
  return `${process.env.APP_URL || `http://localhost:${config.app.port}`}/uploads/${path.basename(filePath)}`;
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  deleteFile,
  getFileUrl,
};
