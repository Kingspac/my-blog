require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const User = require('./models/User');
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/userRoute");
const musicRoutes = require("./routes/musicRoute");
const app = express();

// middlewares
app.use(cors({credentials:true, origin:"http://localhost:3000"}));
app.use(express.json());
app.use(cookieParser()); 
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use('/api', userRoutes); 
app.use("/api/music", musicRoutes); 

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