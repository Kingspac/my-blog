const mongoose = require("mongoose");
const {Schema, model} = mongoose;

const PostSchema = new Schema({
  title: String,
  summary: String,
  content: String,
  cover: String,
  author: {type: Schema.Types.ObjectId, ref: "User"},

  // Array of user IDs who liked this post
  likes: [{type: Schema.Types.ObjectId, ref: "User"}],

  // Array of comment objects
  comments: [
    {
      content: {type: String, required: true},   // the comment text
      author: {type: Schema.Types.ObjectId, ref: "User"},  // who commented
      username: {type: String},                  // store username directly for easy display
      createdAt: {type: Date, default: Date.now} // when it was commented
    }
  ]

}, {timestamps: true});

const PostModel = model("Post", PostSchema);
module.exports = PostModel;