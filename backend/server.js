require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const userRoutes = require("./routes/userRoute");
const mediaRoutes = require("./routes/mediaRoute");
const messageRoutes = require("./routes/messageRoute");
const educationRoutes = require("./routes/educationRoute");

const app = express();

// Allowed frontend origins come from FRONTEND_URL in .env.
// One URL, or several separated by commas.
const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "https://enchwra-project.onrender.com" ||
  "http://localhost:3000"
)
  .split(",")
  .map((url) => url.trim().replace(/\/+$/, "").replace(/\.$/, ""))
  .filter(Boolean);

console.log("Allowed origins:", allowedOrigins);

app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      console.log("CORS blocked origin:", origin);
      return callback(null, false);
    },
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// routes
app.use("/api", userRoutes);
app.use("/api/music", mediaRoutes);
app.use("/api/room", messageRoutes);
app.use("/api/education", educationRoutes);

// variable from .env
const mongoURI = process.env.MONGO_URI;
const PORT = process.env.PORT || 8000;

mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ Successfully connected to MongoDB!"))
  .catch((err) => {
    console.error("❌ Connection Error:");
    console.error(err);
  });

// ===== GLOBAL ERROR HANDLER (catches Multer file size errors) =====
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File too large! Images max 10MB, music/video max 100MB.",
    });
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      message: "Unexpected file field.",
    });
  }
  console.error("Server error:", err.message);
  res.status(500).json({ message: "Server error", error: err.message });
});

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
