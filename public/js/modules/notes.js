function uploadNote() {
  const links = [];

  document.querySelectorAll("#linksContainer div").forEach(div => {
    const label = div.querySelector(".linkLabel").value;
    const url = div.querySelector(".linkURL").value;
    if (label && url) links.push({ label, url });
  });

  const title = document.getElementById("noteTitle").value;
  const subject = document.getElementById("noteSubject").value;
  const file = document.getElementById("noteFile").files[0];

  if (!title || !subject || !file) return alert("All fields required");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "cms_notes");
  formData.append("folder", "college_notes");

  fetch("https://api.cloudinary.com/v1_1/dhmwkj9zm/image/upload", {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(async data => {
    const pdfURL = data.secure_url;
    const previewURL = pdfURL.replace("/raw/upload/", "/image/upload/pg_1/").replace(".pdf", ".png");

    const user = auth.currentUser;
    const staff = (await db.collection("users").doc(user.uid).get()).data();

    await db.collection("notes").add({
      title,
      subject,
      department: staff.department,
      uploadedBy: user.uid,
      status: "pending",
      fileURL: pdfURL,
      previewURL,
      cloudinaryId: data.public_id,
      links,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById("noteTitle").value = "";
    document.getElementById("noteSubject").value = "";
    document.getElementById("noteFile").value = "";
    document.getElementById("linksContainer").innerHTML = "";

    alert("Sent to HOD for approval");
  });
}

function deleteNote(id) {
  if (!confirm("Delete this note permanently?")) return;

  db.collection("notes").doc(id).get().then(doc => {
    const note = doc.data();

    fetch("http://localhost:5000/delete-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId: note.cloudinaryId })
    }).then(res => {
      if (!res.ok) {
        alert("Cloudinary delete failed");
        return;
      }

      db.collection("notes").doc(id).delete().then(loadManageNotes);
    });
  });
}

function addLink() {
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

  document.getElementById("linksContainer").appendChild(div);
}
