// // backend/config/cloudinary.js
// const cloudinary = require('cloudinary').v2;
// const multer = require('multer');
// const { CloudinaryStorage } = require('multer-storage-cloudinary');

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: 'kotha-chat',
//     allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp3', 'wav', 'webm'],
//     resource_type: 'auto'
//   },
// });

// const upload = multer({ storage: storage });

// module.exports = { cloudinary, upload };


// backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage so files land in req.file.buffer
const storage = multer.memoryStorage();

// Optional: filter/limits (adjust to your needs)
const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg','image/jpg','image/png','image/webp',
    'audio/mpeg','audio/wav','audio/webm','video/webm'
  ];
  cb(null, allowed.includes(file.mimetype));
};

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit (change as needed)
  fileFilter
});

// Helper to upload a buffer using cloudinary.upload_stream
function uploadBufferToCloudinary(buffer, options = {}) {
  // options example: { folder: 'kotha-chat', resource_type: 'auto', public_id: 'some-id' }
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

module.exports = { cloudinary, upload, uploadBufferToCloudinary };
