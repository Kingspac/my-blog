const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const MessageSchema = new Schema({
  content: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const MessageModel = model("Message", MessageSchema);
module.exports = MessageModel;
