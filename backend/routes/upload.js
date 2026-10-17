const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { authMiddleware } = require('../middleware/auth');
const store = require('../store');
const { MediaUploadModel } = store;

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Memory Storage (for direct Cloudinary streaming)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Maximum absolute limit 50 MB
});

const { uploadRateLimiter } = require('../middleware/rateLimiter');

router.post('/', authMiddleware, uploadRateLimiter, async (req, res, next) => {
  try {
    // Check feature flag
    const flags = await store.getPlatformSetting('featureFlags', {});
    if (flags?.enableRichMediaUploads === false) {
      return res.status(403).json({ error: 'Media uploads are temporarily disabled by administrator.' });
    }

    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(500).json({ error: 'Multer error: ' + err.message });
      }
      next();
    });
  } catch (flagErr) {
    next();
  }
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Dynamic platform upload ceiling enforcement
    const ceilingMb = await store.getPlatformSetting('fileUploadCeilingMb', 25);
    if (req.file.size > ceilingMb * 1024 * 1024) {
      return res.status(400).json({ error: `File size exceeds the platform limit of ${ceilingMb}MB.` });
    }

    let fileType = 'document';
    let resourceType = 'auto'; // Auto-detects image, video, or audio
    const mime = req.file.mimetype;

    if (mime.startsWith('image/')) {
      fileType = 'image';
      resourceType = 'image';
    } else if (mime.startsWith('video/')) {
      fileType = 'video';
      resourceType = 'video';
    } else if (mime.startsWith('audio/')) {
      fileType = 'audio';
      resourceType = 'video'; // Cloudinary handles audio files under video resource type
    } else {
      resourceType = 'raw';
    }

    // Stream memory buffer directly to Cloudinary
    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'realtime_chat_uploads',
            resource_type: resourceType,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
    };

    const cloudinaryResult = await uploadToCloudinary();

    console.log('✅ Cloudinary Upload Success:', cloudinaryResult.secure_url);

    // Persist media metadata in database
    let mediaDoc = null;
    try {
      mediaDoc = await MediaUploadModel.create({
        publicId: cloudinaryResult.public_id,
        url: cloudinaryResult.secure_url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType,
        mimeType: req.file.mimetype,
        uploader: req.user?.id,
        uploaderUsername: req.user?.username || 'unknown',
        usageType: 'unlinked'
      });
    } catch (saveErr) {
      console.warn('Could not record MediaUploadModel metadata:', saveErr.message);
    }

    res.json({
      id: mediaDoc ? mediaDoc._id.toString() : null,
      url: cloudinaryResult.secure_url,
      publicId: cloudinaryResult.public_id,
      fileType,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
  } catch (err) {
    console.error('Cloudinary Upload error:', err);
    res.status(500).json({ error: 'Cloudinary upload failed: ' + (err.message || 'Unknown error') });
  }
});

module.exports = router;
