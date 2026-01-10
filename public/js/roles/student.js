function loadStudentNotes() {
  const container = document.getElementById("studentNotes");
  if (!container) return;

  container.className = "notes-grid";
  container.innerHTML = "";

  const user = auth.currentUser;

  db.collection("users").doc(user.uid).get().then(userDoc => {
    const profile = userDoc.data();
    const dept = (profile.department || "").toLowerCase();

    db.collection("notes").where("status", "==", "approved").get().then(snap => {
      snap.forEach(doc => {
        const n = doc.data();
        const noteDept = (n.department || "").toLowerCase();

        if (noteDept && noteDept !== dept) return;

        container.innerHTML += `
          <div class="note-card">
            <div class="note-preview"><img src="${n.previewURL}"></div>
            <div class="note-body">
              <div class="note-title">${n.title}</div>
              <a href="${n.fileURL}" target="_blank" class="btn btn-primary">Download</a>
            </div>
          </div>
        `;
      });
    });
  });
}
