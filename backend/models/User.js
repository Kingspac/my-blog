 const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    default: "",
  },
  profilePhoto: {
    type: String,
    default: null,
  },
  // ===== ADMIN FLAG =====
  // Set manually in MongoDB: db.users.updateOne({username:"yourname"},{$set:{isAdmin:true}})
  isAdmin: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = model("User", UserSchema);