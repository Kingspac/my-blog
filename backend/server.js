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

// middlewares
const allowedOrigins = [process.env.FRONTEND_URI || "http://localhost:3000"];
app.use(cors({ 
  credentials: true, 
  origin: allowedOrigins
}));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

// routes
app.use('/api', userRoutes);
app.use("/api/music", mediaRoutes);  // kept /api/music so frontend still works
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

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));
