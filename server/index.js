require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const admin = require("firebase-admin");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

/* ================= FIREBASE ADMIN ================= */
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/* ================= CLOUDINARY ================= */

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET
});

/* ================= HEALTH CHECK ================= */

app.get("/", (req, res) => {
  res.send("CMS API is running");
});

/* ================= DELETE CLOUDINARY FILE ================= */

app.post("/delete-file", async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: "Missing publicId" });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image"
    });

    res.json({ success: true, result });
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    res.status(500).json({ error: "Cloudinary deletion failed" });
  }
});

/* ================= DELETE FIREBASE AUTH USER ================= */

app.post("/delete-user", async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "Missing uid" });
    }

    await admin.auth().deleteUser(uid);

    res.json({ success: true });
  } catch (err) {
    console.error("Firebase delete user error:", err);
    res.status(500).json({ error: "User deletion failed" });
  }
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`CMS Backend running on port ${PORT}`);
});
