const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// Uses CLOUDINARY_URL automatically (your Render shorthand).
// Only uses 3 separate keys if all are set.
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}
cloudinary.config({ secure: true });

// Images only: avatars, covers (10MB = Cloudinary free plan cap)
// fieldSize lets the post text (with pasted base64 images) through
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    fieldSize: 50 * 1024 * 1024,
  },
});

function uploadToCloudinary(buffer, folder, resourceType = "image") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// Safe to call with old local paths: they are simply ignored
async function deleteFromCloudinary(fileUrl, resourceType = "image") {
  if (!fileUrl || !fileUrl.includes("cloudinary")) return;
  try {
    const parts = fileUrl.split("/upload/");
    if (parts.length < 2) return;
    let publicId = parts[1].split("/").slice(1).join("/");
    publicId = publicId.replace(/\.[^/.]+$/, "");
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (_) {}
}

module.exports = { uploadImage, uploadToCloudinary, deleteFromCloudinary };