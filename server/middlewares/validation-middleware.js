import { validationResult } from 'express-validator';

// Generic validation middleware
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log('--- Validation Errors ---');
    console.log(JSON.stringify(errors.array(), null, 2));
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }

  next();
};

// Custom validation for Zimbabwean phone numbers
export const validateZimbabweanPhone = (value) => {
  const phoneRegex = /^(\+263|0)[1-9][0-9]{8}$/;
  return phoneRegex.test(value);
};

// Custom validation for Zimbabwean National ID
export const validateZimbabweanID = (value) => {
  const idRegex = /^[0-9]{2}-?[0-9]{6,7}[a-zA-Z][0-9]{2}$/;
  return idRegex.test(value);
};

// Custom validation for land coordinates (Zimbabwe bounds)
export const validateZimbabweCoordinates = (lat, lng) => {
  // Zimbabwe approximate bounds
  const minLat = -22.5;
  const maxLat = -15.5;
  const minLng = 25.0;
  const maxLng = 33.0;

  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
};

// Custom validation for stand number format
export const validateStandNumber = (value) => {
  // Common Zimbabwean stand number formats
  const standRegex = /^[A-Z0-9-]+$/;
  return standRegex.test(value) && value.length >= 3 && value.length <= 20;
};

// Custom validation for title deed number
export const validateTitleDeedNumber = (value) => {
  const deedRegex = /^[A-Z0-9\/-]+$/;
  return deedRegex.test(value) && value.length >= 5 && value.length <= 50;
};

// Validation middleware for file uploads
export const validateFileUpload = (allowedTypes, maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one file is required'
      });
    }

    const errors = [];

    req.files.forEach((file, index) => {
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        errors.push({
          field: `file_${index}`,
          message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
          value: file.mimetype
        });
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push({
          field: `file_${index}`,
          message: `File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`,
          value: file.size
        });
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors
      });
    }

    next();
  };
};

// Validation for pagination parameters
export const validatePagination = (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page must be a positive integer'
    });
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }

  req.query.page = pageNum;
  req.query.limit = limitNum;

  next();
};

// Validation for date range
export const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Don't allow date ranges longer than 1 year
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (end - start > oneYear) {
      return res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 1 year'
      });
    }
  }

  next();
};

// Validation for monetary amounts
export const validateMonetaryAmount = (value) => {
  const amount = parseFloat(value);

  if (isNaN(amount) || amount < 0) {
    return false;
  }

  // Maximum amount for land transactions (e.g., $10 million)
  const maxAmount = 10000000;

  return amount <= maxAmount;
};

// Validation for land size
export const validateLandSize = (value) => {
  const size = parseFloat(value);

  if (isNaN(size) || size <= 0) {
    return false;
  }

  // Maximum land size in square meters (e.g., 100,000 sqm = 10 hectares)
  const maxSize = 100000;

  return size <= maxSize;
};

// Sanitize user input to prevent XSS
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }

    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};
