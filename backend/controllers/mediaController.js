const Media = require("../models/Media");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { addCommentPhotos, photoOf } = require("../utils/commentPhotos");

// Reads CLOUDINARY_URL automatically (your Render shorthand).
// Only uses the 3 separate keys if they are all set.
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

const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB, Cloudinary free plan cap
});

const secret = process.env.JWT_SECRET;

// HELPER - upload a buffer to Cloudinary
function uploadToCloudinary(buffer, folder, resourceType) {
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

// HELPER - delete a file from Cloudinary using its URL
async function deleteFromCloudinary(fileUrl, resourceType) {
  if (!fileUrl || !fileUrl.includes("cloudinary")) return;
  try {
    const parts = fileUrl.split("/upload/");
    if (parts.length < 2) return;
    let publicId = parts[1].split("/").slice(1).join("/"); // remove version part
    publicId = publicId.replace(/\.[^/.]+$/, ""); // remove extension
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (_) {}
}

// GET MEDIA (With optional category filter)
exports.getAllMedia = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};

    const media = await Media.find(filter)
      .populate("uploadedBy", ["username", "profilePhoto"])
      .sort({ createdAt: -1 });

    res.json(await addCommentPhotos(media));
  } catch (e) {
    res.status(500).json({ message: "Failed to get media", error: e.message });
  }
};

// GET SINGLE MEDIA
exports.getSingleMedia = async (req, res) => {
  const { id } = req.params;
  try {
    const media = await Media.findById(id).populate("uploadedBy", ["username", "profilePhoto"]);
    if (!media) return res.status(404).json("not found");
    res.json(await addCommentPhotos(media));
  } catch (e) {
    res.status(500).json({ message: "Failed to get media", error: e.message });
  }
};

// UPLOAD MEDIA
exports.uploadMedia = [
  uploadMiddleware.fields([
    { name: "audioFile", maxCount: 1 },
    { name: "coverPhoto", maxCount: 1 },
  ]),
  async (req, res) => {
    const { token } = req.cookies;

    jwt.verify(token, secret, {}, async (error, info) => {
      if (error) {
        return res.status(403).json("invalid token");
      }

      try {
        const { title, artist, description, youtubeLink, category, releaseDate } = req.body;

        if (!artist || !artist.trim()) {
          return res.status(400).json("Artist / creator name is required");
        }

        let parsedDate = new Date();
        if (releaseDate) {
          const d = new Date(`${releaseDate}T12:00:00.000Z`);
          if (isNaN(d.getTime())) {
            return res.status(400).json("Invalid release date");
          }
          parsedDate = d;
        }

        let audioFilePath = null;
        let coverPhotoPath = null;

        if (req.files?.audioFile) {
          const file = req.files.audioFile[0];
          audioFilePath = await uploadToCloudinary(file.buffer, "enchwra/audio", "video");
        }

        if (req.files?.coverPhoto) {
          const file = req.files.coverPhoto[0];
          coverPhotoPath = await uploadToCloudinary(file.buffer, "enchwra/covers", "image");
        }

        const mediaDoc = await Media.create({
          title,
          artist: artist.trim(),
          description,
          releaseDate: parsedDate,
          audioFile: audioFilePath,
          youtubeLink: youtubeLink || null,
          coverPhoto: coverPhotoPath,
          uploadedBy: info.id,
          category: category || "music",
        });

        res.json(mediaDoc);
      } catch (e) {
        res.status(500).json({ message: "Upload failed", error: e.message });
      }
    });
  },
];

// DELETE MEDIA
exports.deleteMedia = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");

    try {
      const mediaDoc = await Media.findById(id);
      if (!mediaDoc) return res.status(404).json("not found");

      const isOwner = JSON.stringify(mediaDoc.uploadedBy) === JSON.stringify(info.id);
      if (!isOwner) return res.status(403).json("not authorized");

      await deleteFromCloudinary(mediaDoc.audioFile, "video");
      await deleteFromCloudinary(mediaDoc.coverPhoto, "image");

      await mediaDoc.deleteOne();
      res.json("deleted successfully");
    } catch (e) {
      res.status(500).json({ message: "Delete failed", error: e.message });
    }
  });
};

// LIKE / UNLIKE MEDIA
exports.likeMedia = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");

    try {
      const mediaDoc = await Media.findById(id);
      if (!mediaDoc) return res.status(404).json("not found");

      const alreadyLiked = mediaDoc.likes.includes(info.id);

      if (alreadyLiked) {
        mediaDoc.likes = mediaDoc.likes.filter(
          (userId) => userId.toString() !== info.id.toString()
        );
      } else {
        mediaDoc.likes.push(info.id);
      }

      await mediaDoc.save();
      res.json({ likes: mediaDoc.likes.length, liked: !alreadyLiked });
    } catch (e) {
      res.status(500).json({ message: "Like failed", error: e.message });
    }
  });
};

// ADD COMMENT
exports.addComment = async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;

  jwt.verify(token, secret, {}, async (error, info) => {
    if (error) return res.status(403).json("invalid token");

    try {
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json("comment is empty");

      const mediaDoc = await Media.findById(id);
      if (!mediaDoc) return res.status(404).json("not found");

      const newComment = {
        username: info.username,
        content,
        createdAt: new Date(),
      };

      mediaDoc.comments.push(newComment);
      await mediaDoc.save();

      res.json({ ...newComment, profilePhoto: await photoOf(info.id) });
    } catch (e) {
      res.status(500).json({ message: "Comment failed", error: e.message });
    }
  });
};

// INCREMENT PLAY COUNT
exports.incrementPlayCount = async (req, res) => {
  const { id } = req.params;
  try {
    const media = await Media.findByIdAndUpdate(id, { $inc: { playCount: 1 } }, { new: true });
    if (!media) return res.status(404).json("not found");
    res.json({ playCount: media.playCount });
  } catch (e) {
    res.status(500).json({ message: "Failed to get play count", error: e.message });
  }
};
