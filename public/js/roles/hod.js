function loadPendingNotes() {
  const container = document.getElementById("pendingNotes");
  if (!container) return;

  container.className = "notes-grid";
  container.innerHTML = "";

  db.collection("notes").where("status", "==", "pending").get().then(snap => {
    snap.forEach(doc => {
      const n = doc.data();

      container.innerHTML += `
        <div class="note-card">
          <div class="note-preview"><img src="${n.previewURL}"></div>
          <div class="note-body">
            <div class="note-title">${n.title}</div>
            <div class="note-subject">${n.subject}</div>
            <a href="${n.fileURL}" target="_blank" class="btn btn-outline">Open PDF</a>
          </div>
          <div class="note-footer">
            <button class="btn btn-success" onclick="approveNote('${doc.id}')">Approve</button>
            <button class="btn btn-danger" onclick="rejectNote('${doc.id}')">Reject</button>
          </div>
        </div>
      `;
    });
  });
}

function approveNote(id) {
  db.collection("notes").doc(id).update({ status: "approved" }).then(loadPendingNotes);
}

function rejectNote(id) {
  db.collection("notes").doc(id).get().then(doc => {
    const note = doc.data();

    fetch("http://localhost:5000/delete-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId: note.cloudinaryId })
    }).then(() => {
      db.collection("notes").doc(id).delete().then(loadPendingNotes);
    });
  });
}

async function loadManageNotes() {
  const container = document.getElementById("manageNotes");
  if (!container) return;

  container.innerHTML = "";
  container.className = "notes-grid";

  const usersSnap = await db.collection("users")
    .where("role", "==", "staff")
    .get();

  for (const userDoc of usersSnap.docs) {
    const staff = userDoc.data();
    const staffId = userDoc.id;

    const notesSnap = await db.collection("notes")
      .where("uploadedBy", "==", staffId)
      .where("status", "==", "approved")
      .get();

    if (notesSnap.empty) continue;

    let notesHTML = "";

    notesSnap.forEach(doc => {
      const n = doc.data();
      notesHTML += `
        <div class="note-item">
          <span>${n.title}</span>
          <a href="${n.fileURL}" target="_blank">Open</a>
        </div>
      `;
    });

    container.innerHTML += `
      <div class="card">
        <h3>${staff.name}</h3>
        <div>${notesHTML}</div>
      </div>
    `;
  }
}
async function loadHodApprovals() {
  const snap = await db.collection("approvals").where("stage","==","hod").get();
  const box = document.getElementById("hodApprovals");
  box.innerHTML = "";

  snap.forEach(doc => {
    const a = doc.data();
    box.innerHTML += `
      <div class="card">
        <p>${a.uid} (${a.role})</p>
        <button onclick="finalApprove('${doc.id}','${a.role}')">Approve</button>
      </div>
    `;
  });
}

function finalApprove(uid, role) {
  db.collection("users").doc(uid).update({ status: "active" });
  db.collection("approvals").doc(uid).delete();

  if (role === "student") db.collection("students").doc(uid).set({});
  if (role === "staff") db.collection("staff").doc(uid).set({});
}

async function loadHodStudentApprovals() {
  const box = document.getElementById("hodStudentApprovals");
  if (!box) return;

  const snap = await db.collection("approvals")
    .where("stage", "==", "hod")
    .where("role", "==", "student")
    .get();

  box.innerHTML = "";

  snap.forEach(doc => {
    const a = doc.data();
    box.innerHTML += `
      <div class="card">
        <p>${a.uid}</p>
        <button class="btn btn-success" onclick="finalApprove('${doc.id}','student')">Final Approve</button>
      </div>
    `;
  });
}

async function loadHodStaffApprovals() {
  const box = document.getElementById("hodStaffApprovals");
  if (!box) return;

  const snap = await db.collection("approvals")
    .where("stage", "==", "hod")
    .where("role", "==", "staff")
    .get();

  box.innerHTML = "";

  snap.forEach(doc => {
    const a = doc.data();
    box.innerHTML += `
      <div class="card">
        <p>${a.uid}</p>
        <button class="btn btn-success" onclick="finalApprove('${doc.id}','staff')">Approve</button>
  <button class="btn btn-danger" onclick="rejectUser('${doc.id}')">Reject</button>
      </div>
    `;
  });
}

async function finalApprove(uid, role) {
  await db.collection("users").doc(uid).update({ status: "active" });
  await db.collection("approvals").doc(uid).delete();

  if (role === "student") await db.collection("students").doc(uid).set({});
  if (role === "staff") await db.collection("staff").doc(uid).set({});

  loadHodStudentApprovals();
  loadHodStaffApprovals();
}

roles.hod.nav.push(
  { name: "Customize", id: "hodCustomize" }
);
window.loadHodCustomize = async function () {
  const deptBox = document.getElementById("deptList");
  const classBox = document.getElementById("classList");

  deptBox.innerHTML = "";
  classBox.innerHTML = "";

  const depts = await db.collection("config_departments").get();
  depts.forEach(d => {
    deptBox.innerHTML += `
      <div class="note-item">
        ${d.data().name}
        <button class="btn btn-danger" onclick="deleteDept('${d.id}')">✖</button>
      </div>`;
  });

  const classes = await db.collection("config_classes").get();
  classes.forEach(c => {
    classBox.innerHTML += `
      <div class="note-item">
        ${c.data().name}
        <button class="btn btn-danger" onclick="deleteClass('${c.id}')">✖</button>
      </div>`;
  });
};

window.addDepartment = async () => {
  const name = newDept.value.trim();
  if (!name) return;
  await db.collection("config_departments").add({ name });
  loadHodCustomize();
};

window.deleteDept = async (id) => {
  await db.collection("config_departments").doc(id).delete();
  loadHodCustomize();
};

window.addClass = async () => {
  const name = newClass.value.trim();
  if (!name) return;
  await db.collection("config_classes").add({ name });
  loadHodCustomize();
};

window.deleteClass = async (id) => {
  await db.collection("config_classes").doc(id).delete();
  loadHodCustomize();
};
