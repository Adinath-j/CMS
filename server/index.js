const express = require("express");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json"))
});

// ☁️ Cloudinary
cloudinary.config({
  cloud_name: "dhmwkj9zm",
  api_key: "YOUR_API_KEY",
  api_secret: "YOUR_API_SECRET"
});

// Health check
app.get("/", (req, res) => {
  res.send("CMS API running");
});

// Delete Cloudinary file
app.post("/delete-file", async (req, res) => {
  try {
    const { publicId } = req.body;
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image"
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔥 Delete Firebase Auth User
app.post("/delete-user", async (req, res) => {
  try {
    const { uid } = req.body;
    await admin.auth().deleteUser(uid);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(5000, () => console.log("Server running on port 5000"));
