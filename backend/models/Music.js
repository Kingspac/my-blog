const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const MusicSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  artist: {
    type: String,
    required: true,
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
  category: {
    type: String,
    enum: ["music", "comedy", "culture", "video"],
    default: "music",
  },
}, { timestamps: true });

const MusicModel = model("Music", MusicSchema);
module.exports = MusicModel;
