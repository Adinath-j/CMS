/* ===================== UPLOAD NOTE ===================== */
window.uploadNote = async function () {
  try {
    const links = [];

    document.querySelectorAll("#linksContainer div").forEach(div => {
      const label = div.querySelector(".linkLabel")?.value?.trim();
      const url = div.querySelector(".linkURL")?.value?.trim();
      if (label && url) links.push({ label, url });
    });

    const title = noteTitle.value.trim();
    const subject = noteSubject.value.trim();
    const chapter = noteChapter?.value?.trim() || "";
    const file = noteFile.files[0];

    if (!title || !subject || !file) {
      alert("Title, Subject & PDF required");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF allowed");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "cms_notes");
    formData.append("folder", "college_notes");

    const res = await fetch("https://api.cloudinary.com/v1_1/dhmwkj9zm/image/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!data.secure_url) throw "Upload failed";

    const user = auth.currentUser;
    const staff = (await db.collection("users").doc(user.uid).get()).data();

    await db.collection("notes").add({
      title,
      subject,
      chapter,
      department: staff.department,
      uploadedBy: user.uid,
      status: "pending",
      fileURL: data.secure_url,
      previewURL: data.secure_url.replace("/raw/upload/", "/image/upload/pg_1/").replace(".pdf", ".png"),
      cloudinaryId: data.public_id,
      links,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    noteTitle.value = "";
    noteSubject.value = "";
    if (noteChapter) noteChapter.value = "";
    noteFile.value = "";
    linksContainer.innerHTML = "";

    alert("Sent for approval");

  } catch (e) {
    console.error(e);
    alert("Upload failed");
  }
};

/* ===================== DELETE NOTE ===================== */

window.deleteNote = async function (id) {
  if (!confirm("Delete this note permanently?")) return;
  try {
    const doc = await db.collection("notes").doc(id).get();
    if (!doc.exists) {
      alert("Note not found");
      return;
    }

    const note = doc.data();

    // Delete from Cloudinary first
    const res = await fetch("https://cms2-xpvn.onrender.com/delete-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId: note.cloudinaryId })
    });

    if (!res.ok) {
      throw new Error("Cloudinary delete failed");
    }

    // Delete Firestore record
    await db.collection("notes").doc(id).delete();
    alert("Note deleted");
    // Refresh UI safely
    window.loadManageNotes?.();
  } catch (err) {
    console.error(err);
    alert("Failed to delete note");
  }
};
/* ===================== ADD REFERENCE LINK ===================== */

window.addLink = function () {
  const container = document.getElementById("linksContainer");
  if (!container) return;

  const div = document.createElement("div");
  div.className = "form-group";
  div.style.display = "grid";
  div.style.gridTemplateColumns = "1fr 2fr auto";
  div.style.gap = "8px";

  div.innerHTML = `
    <input class="form-control linkLabel" placeholder="Label">
    <input class="form-control linkURL" placeholder="https://...">
    <button class="btn btn-danger" onclick="this.parentElement.remove()">✖</button>
  `;

  container.appendChild(div);
};