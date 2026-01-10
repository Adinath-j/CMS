const approvalsRef = db.collection("approvals");

/* ========== UTIL ========== */
async function getMyProfile() {
  const uid = auth.currentUser.uid;
  return (await db.collection("users").doc(uid).get()).data();
}

/* ========== STAFF → STUDENT APPROVAL QUEUE ========== */
window.loadStudentApprovals = async function () {
  const box = document.getElementById("studentApprovals");
  if (!box) return;

  box.innerHTML = "";

  const staff = await getMyProfile();

  const snap = await approvalsRef
    .where("role","==","student")
    .where("department","==",staff.department)
    .get();

  snap.forEach(doc=>{
    box.innerHTML += renderApprovalCard(doc.id,doc.data(),"student");
  });
};

/* ========== HOD → STUDENT APPROVAL QUEUE ========== */
window.loadHodStudentApprovals = async function () {
  const box = document.getElementById("hodStudentApprovals");
  if (!box) return;

  box.innerHTML = "";
  const hod = await getMyProfile();

  const snap = await approvalsRef
    .where("role","==","student")
    .where("department","==",hod.department)
    .get();

  snap.forEach(doc=>{
    box.innerHTML += renderApprovalCard(doc.id,doc.data(),"student");
  });
};

/* ========== HOD → STAFF APPROVAL QUEUE ========== */
window.loadHodStaffApprovals = async function () {
  const box = document.getElementById("hodStaffApprovals");
  if (!box) return;

  box.innerHTML = "";
  const hod = await getMyProfile();

  const snap = await approvalsRef
    .where("role","==","staff")
    .where("department","==",hod.department)
    .get();

  if (snap.empty) {
    box.innerHTML = `<div class="card">No pending staff approvals</div>`;
    return;
  }

  snap.forEach(doc=>{
    box.innerHTML += renderApprovalCard(doc.id,doc.data(),"staff");
  });
};

/* ========== APPROVE (STAFF or HOD) ========== */
window.approveUser = async function(uid, role){
  const me = await getMyProfile();

  // Role enforcement
  if (role === "staff" && me.role !== "hod") {
    return alert("Only HOD can approve staff");
  }

  if (role === "student" && !["staff","hod"].includes(me.role)) {
    return alert("Not allowed");
  }

  const approvalDoc = await approvalsRef.doc(uid).get();
  if (!approvalDoc.exists) {
    alert("Already processed");
    return;
  }

  // Department locking
  if (approvalDoc.data().department !== me.department) {
    alert("Cross-department approval blocked");
    return;
  }

  await db.collection("users").doc(uid).update({ status:"active" });
  await approvalsRef.doc(uid).delete();

  reloadApprovals();
};

/* ========== REJECT (HOD or STAFF) ========== */
window.rejectUser = async function(uid){
  if(!confirm("Reject & permanently delete this user?")) return;

  const me = await getMyProfile();
  const approvalDoc = await approvalsRef.doc(uid).get();

  if (!approvalDoc.exists) {
    alert("Already processed");
    return;
  }

  if (approvalDoc.data().department !== me.department) {
    alert("Cross-department rejection blocked");
    return;
  }

  await fetch("https://cms2-xpvn.onrender.com/delete-user",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ uid })
  });

  await db.collection("users").doc(uid).delete();
  await approvalsRef.doc(uid).delete();

  reloadApprovals();
};

/* ========== UI HELPER ========== */
function reloadApprovals(){
  loadStudentApprovals?.();
  loadHodStudentApprovals?.();
  loadHodStaffApprovals?.();
}

/* ========== CARD RENDERER ========== */
function renderApprovalCard(uid, a, role){
  return `
    <div class="note-card">
      <div class="note-body">
        <div class="note-title">${a.name}</div>
        <div class="note-subject">${a.email}</div>

        ${role==="student"?`
          <div>Roll: ${a.rollNo}</div>
          <div>Class: ${a.class}</div>
          <div>Sem: ${a.semester}</div>
        `:`
          <div>Staff ID: ${a.staffId}</div>
        `}

        <div>Department: ${a.department}</div>
      </div>

      <div class="note-footer">
        <button class="btn btn-success" onclick="approveUser('${uid}','${role}')">Approve</button>
        <button class="btn btn-danger" onclick="rejectUser('${uid}')">Reject</button>
      </div>
    </div>
  `;
}
