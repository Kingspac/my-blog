const User = require("../models/User");

// Adds `profilePhoto` to every comment of a post / media doc (or a list of them).
// Uses ONE small query for all the commenters, so it stays light.
async function addCommentPhotos(input) {
  const isList = Array.isArray(input);
  const docs = (isList ? input : [input])
    .filter(Boolean)
    .map((d) => (d.toObject ? d.toObject() : d));

  const names = new Set();
  docs.forEach((d) =>
    (d.comments || []).forEach((c) => c.username && names.add(c.username))
  );

  if (names.size) {
    const users = await User.find({ username: { $in: [...names] } }).select(
      "username profilePhoto"
    );
    const photos = new Map(users.map((u) => [u.username, u.profilePhoto || null]));
    docs.forEach((d) =>
      (d.comments || []).forEach((c) => {
        c.profilePhoto = photos.get(c.username) || null;
      })
    );
  }

  return isList ? docs : docs[0] || null;
}

// profile photo of one user id (used for a comment that was just posted)
async function photoOf(userId) {
  const u = await User.findById(userId).select("profilePhoto");
  return u?.profilePhoto || null;
}

module.exports = { addCommentPhotos, photoOf };
