import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const createUploadsDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    createUploadsDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true,
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: JPEG, PNG, GIF, PDF, DOC, DOCX'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10 // Maximum 10 files per request
  }
});

// Single file upload middleware
export const uploadSingleFile = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File size exceeds 5MB limit'
            });
          } else if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              message: 'Too many files uploaded'
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed'
        });
      }
      
      next();
    });
  };
};

// Multiple files upload middleware
export const uploadMultipleFiles = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File size exceeds 5MB limit'
            });
          } else if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
              success: false,
              message: `Maximum ${maxCount} files allowed`
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed'
        });
      }
      
      next();
    });
  };
};

// Document-specific upload middleware (handles both titleDeed and documents fields)
export const uploadDocuments = (req, res, next) => {
  upload.fields([
    { name: 'titleDeed', maxCount: 5 },
    { name: 'documents', maxCount: 5 },
    { name: 'images', maxCount: 10 }
  ])(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size exceeds 5MB limit'
          });
        } else if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files uploaded'
          });
        }
      }

      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }

    next();
  });
};

// Profile picture upload middleware
export const uploadProfilePicture = uploadSingleFile('profilePicture');

// Land photos upload middleware
export const uploadLandPhotos = uploadMultipleFiles('photos', 10);

// Cleanup function to remove uploaded files (for error handling)
export const cleanupUploadedFiles = (files) => {
  if (files && Array.isArray(files)) {
    files.forEach(file => {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
  }
};

// Middleware to handle file cleanup on errors
export const handleFileCleanup = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (res.statusCode >= 400) {
      // Clean up uploaded files if there's an error
      if (req.files) {
        cleanupUploadedFiles(req.files);
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};
