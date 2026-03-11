const mongoose = require("mongoose");
const {Schema, model} = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    min: 4,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    default: "",       // empty by default
  },
  profilePhoto: {
    type: String,
    default: "",       // empty by default
  },
}, { timestamps: true });

const UserModel = model("User", userSchema);
module.exports = UserModel;