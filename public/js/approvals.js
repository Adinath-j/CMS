const approvalsRef = db.collection("approvals");
/* -------------------- STAFF: Student Requests -------------------- */
window.loadStudentApprovals = async function () {
  const box = document.getElementById("studentApprovals");
  if (!box) return;

  box.className = "notes-grid";
  box.innerHTML = "";

  const snap = await approvalsRef.where("role", "==", "student").get();

  snap.forEach(doc => {
    const a = doc.data();
box.innerHTML += `
  <div class="note-card">
    <div class="note-body">
      <div class="note-title">${a.name}</div>
      <div class="note-subject">${a.email}</div>
      <div class="note-subject">Roll: ${a.rollNo}</div>
      <div class="note-subject">Dept: ${a.department}</div>
      <div class="note-subject">Class: ${a.class}</div>
      <div class="note-subject">Sem: ${a.semester}</div>
    </div>
    <div class="note-footer">
      <button class="btn btn-success" onclick="approveStudent('${doc.id}')">Approve</button>
      <button class="btn btn-danger" onclick="rejectUser('${doc.id}')">Reject</button>
    </div>
  </div>
`;
});
};

/* Staff & HOD can approve students */
window.approveStudent = async function (uid) {
  const me = auth.currentUser;
  const myProfile = (await db.collection("users").doc(me.uid).get()).data();

  // Only staff or HOD can approve students
  if (myProfile.role !== "staff" && myProfile.role !== "hod") {
    alert("You are not allowed to approve students");
    return;
  }

  // Activate the student
  await db.collection("users").doc(uid).update({ status: "active" });

  // Remove from approvals queue
  await approvalsRef.doc(uid).delete();

  // Reload UIs
  loadStudentApprovals?.();
  loadHodStudentApprovals?.();
};

/* -------------------- FINAL APPROVAL (HOD ONLY) -------------------- */
window.finalApprove = async function (uid, role) {
  const me = auth.currentUser;
  const myProfile = (await db.collection("users").doc(me.uid).get()).data();

  if (role === "staff" && myProfile.role !== "hod") {
    alert("Only HOD can approve staff");
    return;
  }

  // Students can be approved by staff OR hod
  if (role === "student" && myProfile.role !== "staff" && myProfile.role !== "hod") {
    alert("You are not allowed to approve students");
    return;
  }

  await db.collection("users").doc(uid).update({ status: "active" });
  await db.collection("approvals").doc(uid).delete();

  loadStudentApprovals?.();
  loadHodStudentApprovals?.();
  loadHodStaffApprovals?.();
};

/* -------------------- HOD: Student Approvals -------------------- */
window.loadHodStudentApprovals = async function () {
  const box = document.getElementById("hodStudentApprovals");
  if (!box) return;

  box.className = "notes-grid";
  box.innerHTML = "";

  const snap = await approvalsRef.where("role", "==", "student").get();

  snap.forEach(doc => {
    const a = doc.data();box.innerHTML += `
  <div class="note-card">
    <div class="note-body">
      <div class="note-title">${a.name}</div>
      <div class="note-subject">${a.email}</div>
      <div class="note-subject">Roll: ${a.rollNo}</div>
      <div class="note-subject">Dept: ${a.department}</div>
      <div class="note-subject">Class: ${a.class}</div>
      <div class="note-subject">Sem: ${a.semester}</div>
    </div>
    <div class="note-footer">
      <button class="btn btn-success" onclick="finalApprove('${doc.id}','student')">Approve</button>
      <button class="btn btn-danger" onclick="rejectUser('${doc.id}')">Reject</button>
    </div>
  </div>
`;

  });
};

/* -------------------- HOD: Staff Approvals -------------------- */
window.loadHodStaffApprovals = async function () {
  const box = document.getElementById("hodStaffApprovals");
  if (!box) return;

  box.className = "notes-grid";
  box.innerHTML = "";

  const snap = await approvalsRef.where("role", "==", "staff").get();

  if (snap.empty) {
    box.innerHTML = `<div class="card">No pending staff approvals</div>`;
    return;
  }

  snap.forEach(doc => {
    const a = doc.data();
    box.innerHTML += `
  <div class="note-card">
    <div class="note-body">
      <div class="note-title">${a.name}</div>
      <div class="note-subject">${a.email}</div>
      <div class="note-subject">Staff ID: ${a.staffId}</div>
      <div class="note-subject">Department: ${a.department}</div>
    </div>
    <div class="note-footer">
      <button class="btn btn-success" onclick="finalApprove('${doc.id}','staff')">Approve</button>
      <button class="btn btn-danger" onclick="rejectUser('${doc.id}')">Reject</button>
    </div>
  </div>
`;

  });
};
window.rejectUser = async function(uid){
  if(!confirm("Reject and delete this user?")) return;

  await fetch("http://localhost:5000/delete-user", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ uid })
  });

  await db.collection("users").doc(uid).delete();
  await db.collection("approvals").doc(uid).delete();

  loadStudentApprovals();
  loadHodStudentApprovals();
  loadHodStaffApprovals();
};
