window.loadStudentNotes = async function () {
  try {
    const container = document.getElementById("studentNotes");
    if (!container) return;

    container.className = "notes-grid";
    container.innerHTML = "";

    const user = auth.currentUser;
    if (!user) return;

    const userSnap = await db.collection("users").doc(user.uid).get();
    if (!userSnap.exists) {
      container.innerHTML = `<div class="card">Profile not found</div>`;
      return;
    }

    const profile = userSnap.data();
    const department = profile.department;

    if (!department) {
      container.innerHTML = `<div class="card">No department assigned</div>`;
      return;
    }

    // Fetch only relevant notes
    const notesSnap = await db.collection("notes")
      .where("status", "==", "approved")
      .where("department", "==", department)
      .get();

    if (notesSnap.empty) {
      container.innerHTML = `<div class="card">No notes available</div>`;
      return;
    }

    notesSnap.forEach(doc => {
      const n = doc.data();

      container.innerHTML += `
        <div class="note-card">
          <div class="note-preview">
            <img src="${n.previewURL}" alt="Preview">
          </div>
          <div class="note-body">
            <div class="note-title">${n.title}</div>
            <div class="note-subject">${n.subject || ""}</div>
            <a href="${n.fileURL}" target="_blank" class="btn btn-primary">
              Download
            </a>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error("Student notes load failed:", err);
    const container = document.getElementById("studentNotes");
    if (container) {
      container.innerHTML = `<div class="card">Failed to load notes</div>`;
    }
  }
};
