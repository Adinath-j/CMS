/* ================= PENDING NOTES ================= */

window.loadPendingNotes = async function () {
  const container = document.getElementById("pendingNotes");
  if (!container) return;

  container.className = "notes-grid";
  container.innerHTML = "";

  const snap = await db.collection("notes")
    .where("status", "==", "pending")
    .get();

  if (snap.empty) {
    container.innerHTML = `<div class="card">No pending notes</div>`;
    return;
  }

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
};

window.approveNote = async function (id) {
  await db.collection("notes").doc(id).update({ status: "approved" });
  loadPendingNotes();
};

window.rejectNote = async function (id) {
  const doc = await db.collection("notes").doc(id).get();
  if (!doc.exists) return;

  const note = doc.data();

  await fetch("http://localhost:5000/delete-file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId: note.cloudinaryId })
  });

  await db.collection("notes").doc(id).delete();
  loadPendingNotes();
};



/* ================= ALL NOTES BY STAFF ================= */

window.loadManageNotes = async function () {
  const container = document.getElementById("manageNotes");
  if (!container) return;

  container.className = "notes-grid";
  container.innerHTML = "";

  const usersSnap = await db.collection("users")
    .where("role", "==", "staff")
    .where("status", "==", "active")
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
};



/* ================= STUDENT & STAFF APPROVALS ================= */

window.loadHodStudentApprovals = async function () {
  const box = document.getElementById("hodStudentApprovals");
  if (!box) return;

  box.innerHTML = "";

  const hod = (await db.collection("users").doc(auth.currentUser.uid).get()).data();

  const snap = await db.collection("approvals")
    .where("role", "==", "student")
    .where("department", "==", hod.department)
    .get();

  snap.forEach(doc => {
    const a = doc.data();
    box.innerHTML += renderApprovalCard(doc.id, a, "student");
  });
};

window.loadHodStaffApprovals = async function () {
  const box = document.getElementById("hodStaffApprovals");
  if (!box) return;

  box.innerHTML = "";

  const hod = (await db.collection("users").doc(auth.currentUser.uid).get()).data();

  const snap = await db.collection("approvals")
    .where("role", "==", "staff")
    .where("department", "==", hod.department)
    .get();

  if (snap.empty) {
    box.innerHTML = `<div class="card">No pending staff approvals</div>`;
    return;
  }

  snap.forEach(doc => {
    const a = doc.data();
    box.innerHTML += renderApprovalCard(doc.id, a, "staff");
  });
};


window.finalApprove = async function (uid, role) {
  await db.collection("users").doc(uid).update({ status: "active" });
  await db.collection("approvals").doc(uid).delete();

  if (role === "student") await db.collection("students").doc(uid).set({});
  if (role === "staff") await db.collection("staff").doc(uid).set({});

  loadHodStudentApprovals();
  loadHodStaffApprovals();
};



/* ================= CUSTOMIZE (DEPT & CLASS) ================= */

window.loadHodCustomize = async function () {
  const deptBox = document.getElementById("deptList");
  const classBox = document.getElementById("classList");

  if (!deptBox || !classBox) return;

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

window.addDepartment = async function () {
  const name = newDept.value.trim();
  if (!name) return;
  await db.collection("config_departments").add({ name });
  loadHodCustomize();
};

window.deleteDept = async function (id) {
  await db.collection("config_departments").doc(id).delete();
  loadHodCustomize();
};

window.addClass = async function () {
  const name = newClass.value.trim();
  if (!name) return;
  await db.collection("config_classes").add({ name });
  loadHodCustomize();
};

window.deleteClass = async function (id) {
  await db.collection("config_classes").doc(id).delete();
  loadHodCustomize();
};



/* ================= UI HELPER ================= */

function renderApprovalCard(uid, a, role) {
  return `
    <div class="note-card">
      <div class="note-body">
        <div class="note-title">${a.name}</div>
        <div>${a.email}</div>
        ${role === "student" ? `
          <div>Roll: ${a.rollNo}</div>
          <div>Sem: ${a.semester}</div>
        ` : `
          <div>Staff ID: ${a.staffId}</div>
        `}
        <div>Department: ${a.department}</div>
      </div>
      <div class="note-footer">
        <button class="btn btn-success" onclick="finalApprove('${uid}','${role}')">Approve</button>
        <button class="btn btn-danger" onclick="rejectUser('${uid}')">Reject</button>
      </div>
    </div>
  `;
}
