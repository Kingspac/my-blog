const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const EducationSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    default: "",
  },
  summary: {
    type: String,
    default: "",
  },
  cover: {
    type: String,
    default: null,
  },
  youtubeLink: {
    type: String,
    default: null,
  },
  category: {
    type: String,
    enum: ["history", "language", "health", "career"],
    required: true,
  },
  // For language category - which language
  language: {
    type: String,
    enum: ["adara", "hausa", "english", null],
    default: null,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

const EducationModel = model("Education", EducationSchema);
module.exports = EducationModel;
