require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const User = require('./models/User');
const mongoose = require('mongoose');
const app = express();
app.use(cors());
app.use(express.json());

// Use the variable from .env
const mongoURI = process.env.MONGO_URI;
const PORT = process.env.PORT || 4000;

mongoose.connect(mongoURI)
  .then(() => console.log("✅ Successfully connected to Dory MongoDB!"))
  .catch((err) => {
    console.error("❌ Connection Error:");
    console.error(err);
  });




app.get('/', (req, res) => {
res.json({
message: 'MERN API with Schema Validation',
version: '2.0'
});
});
// CREATE - with validation
app.get('/api/users', (req, res) => {
res.json({
  Name: "kingsley bulus",
  rueueu:"r{}/}{]e}/",
  otier:"fjsjdjru",
})
});

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));