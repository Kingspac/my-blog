const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const MediaSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  artist: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  audioFile: {
    type: String,
    default: null,
  },
  youtubeLink: {
    type: String,
    default: null,
  },
  coverPhoto: {
    type: String,
    default: null,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      username: { type: String, required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  category: {
    type: String,
    enum: ["music", "video"],
    default: "music",
  },
}, { timestamps: true });

const MediaModel = model("Media", MediaSchema);
module.exports = MediaModel;
