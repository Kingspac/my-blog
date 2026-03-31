require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require("cookie-parser");

const userRoutes = require("./routes/userRoute");
const mediaRoutes = require("./routes/mediaRoute");
const messageRoutes = require("./routes/messageRoute");
const educationRoutes = require("./routes/educationRoute");

const app = express();

// CORS - supports both development and production
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({
  credentials: true,
  origin: allowedOrigin,
}));

app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

// routes
app.use('/api', userRoutes);
app.use("/api/music", mediaRoutes);
app.use("/api/room", messageRoutes);
app.use("/api/education", educationRoutes);

// variable from .env
const mongoURI = process.env.MONGO_URI;
const PORT = process.env.PORT || 4000;

mongoose.connect(mongoURI)
  .then(() => console.log("✅ Successfully connected to MongoDB!"))
  .catch((err) => {
    console.error("❌ Connection Error:");
    console.error(err);
  });

// ===== GLOBAL ERROR HANDLER (catches Multer file size errors) =====
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File too large! Maximum allowed size is 200MB."
    });
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      message: "Unexpected file field."
    });
  }
  // Any other error
  console.error("Server error:", err.message);
  res.status(500).json({ message: "Server error", error: err.message });
});

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
 