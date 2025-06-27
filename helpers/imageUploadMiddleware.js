import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type. Only image files are allowed. Received: ${file.mimetype}`
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB in bytes
  },
});

const imageUploadMiddleware = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "File too large",
            message: "Image files must be smaller than 5MB",
          });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            error: "Unexpected field",
            message: 'Images should be uploaded under the "photos" field',
          });
        }
      }

      return res.status(400).json({
        error: "Upload error",
        message: err.message,
      });
    }

    // If no files were uploaded, req.files will be an empty array
    // This is fine - we continue silently as per requirements
    if (!req.files) {
      req.files = [];
    }

    next();
  });
};

export default imageUploadMiddleware;
