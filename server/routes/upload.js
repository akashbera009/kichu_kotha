const express = require('express');
const upload = require('../config/multer');   // ✅ now upload is the multer instance
const { uploadOnCloudinary } = require('../config/cloudinary');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/messages/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'No file uploaded' });
    }

    const result = await uploadOnCloudinary(req.file.path);
    if (!result) {
      return res.status(500).json({ status: 'error', message: 'Upload failed' });
    }

    res.status(200).json({
      status: 'success',
      url: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
