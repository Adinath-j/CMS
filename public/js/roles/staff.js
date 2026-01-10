function loadManageNotes() {
  const container = document.getElementById("manageNotes");
  if (!container) return;

  container.className = "notes-grid";
  container.innerHTML = "";

  const user = auth.currentUser;

  db.collection("notes")
    .where("uploadedBy", "==", user.uid)
    .where("status", "==", "approved")
    .get()
    .then(snap => {
      snap.forEach(doc => {
        const n = doc.data();
        container.innerHTML += `
          <div class="note-card">
            <div class="note-preview"><img src="${n.previewURL}"></div>
            <div class="note-body">
              <div class="note-title">${n.title}</div>
              <a href="${n.fileURL}" target="_blank" class="btn btn-outline">Download</a>
            </div>
            <div class="note-footer">
              <button class="btn btn-danger" onclick="deleteNote('${doc.id}')">Delete</button>
            </div>
          </div>
        `;
      });
    });
}
async function loadStudentApprovals() {
  const box = document.getElementById("studentApprovals");

  const snap = await db.collection("approvals").where("stage","==","staff").get();
  box.innerHTML = "";

  snap.forEach(doc => {
    const a = doc.data();
    box.innerHTML += `
      <div class="card">
        <p>${a.uid}</p>
        <button class="btn btn-success" onclick="approveStudent('${doc.id}')">Approve</button>
  <button class="btn btn-danger" onclick="rejectUser('${doc.id}')">Reject</button>
      </div>
    `;
  });
}

function approveStudent(uid) {
  db.collection("users").doc(uid).update({ status: "staffApproved" });
  db.collection("approvals").doc(uid).update({ stage: "hod" });
}
async function loadStudentApprovals() {
  const box = document.getElementById("studentApprovals");
  if (!box) return;

  const snap = await db.collection("approvals")
    .where("stage", "==", "staff")
    .get();

  box.innerHTML = "";

  snap.forEach(doc => {
    const a = doc.data();
    box.innerHTML += `
      <div class="card">
        <p>${a.uid}</p>
        <p>${a.department}</p>
        <button class="btn btn-success" onclick="approveStudent('${doc.id}')">Approve</button>
      </div>
    `;
  });
}

async function approveStudent(uid) {
  await db.collection("users").doc(uid).update({ status: "staffApproved" });
  await db.collection("approvals").doc(uid).update({ stage: "hod" });
  loadStudentApprovals();
}

window.rejectUser = async function (uid) {
  if (!confirm("Reject this user? This will delete their account.")) return;

  try {
    // Delete Firestore user profile
    await db.collection("users").doc(uid).delete();

    // Delete approval request
    await db.collection("approvals").doc(uid).delete();

    // Call backend to delete Firebase Auth user
    await fetch("http://localhost:5000/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid })
    });

    alert("User rejected and removed");

    loadStudentApprovals?.();
    loadHodStudentApprovals?.();
    loadHodStaffApprovals?.();

  } catch (err) {
    alert("Reject failed: " + err.message);
  }
};

let attendanceBuffer = {};

window.loadAttendanceStudents = async function () {
  const list = document.getElementById("attendanceList");
  if (!list) return;

  list.innerHTML = "";
  attendanceBuffer = {};

  const user = auth.currentUser;
  const profile = (await db.collection("users").doc(user.uid).get()).data();

  const snap = await db.collection("users")
    .where("role","==","student")
    .where("department","==",profile.department)
    .get();

  snap.forEach(doc => {
    const s = doc.data();
    attendanceBuffer[doc.id] = "present"; // default

    list.innerHTML += `
      <div class="note-card">
        <div class="note-body">
          <div class="note-title">${s.name}</div>
          <div class="note-subject">Roll: ${s.rollNo}</div>
        </div>
        <div class="note-footer">
          <button class="btn btn-success" onclick="markPresent('${doc.id}')">Present</button>
          <button class="btn btn-danger" onclick="markAbsent('${doc.id}')">Absent</button>
        </div>
      </div>
    `;
  });
};

window.markPresent = uid => attendanceBuffer[uid] = "present";
window.markAbsent  = uid => attendanceBuffer[uid] = "absent";


window.submitAttendance = async function () {
  const subject = document.getElementById("attSubject").value.trim();
  const lecture = document.getElementById("attLecture").value.trim();

  if (!subject || !lecture) {
    alert("Enter subject and lecture ID");
    return;
  }

  const me = auth.currentUser;
  const profile = (await db.collection("users").doc(me.uid).get()).data();

  const date = new Date().toISOString().split("T")[0];
  const sessionId = `${profile.department}_${date}_${lecture}`;

  const batch = db.batch();

  for (const uid in attendanceBuffer) {
    const ref = db.collection("attendance")
                  .doc(sessionId)
                  .collection("records")
                  .doc(uid);

    batch.set(ref, {
      studentUid: uid,
      staffUid: me.uid,
      subject,
      status: attendanceBuffer[uid],
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  await batch.commit();
  alert("Attendance submitted successfully");
};


window.loadStaffAttendance = async function() {
  const box = document.getElementById("attendanceList");
  box.innerHTML = "";

  const me = auth.currentUser;
  const staff = (await db.collection("users").doc(me.uid).get()).data();

  const today = new Date().toISOString().slice(0,10);
  const lectureKey = `${staff.department}_${today}`;

  const snap = await db.collection("attendance")
    .doc(lectureKey)
    .collection("records")
    .get();

  snap.forEach(doc=>{
    const s = doc.data();
    box.innerHTML += `
      <div class="note-card">
        <div class="note-body">
          <div class="note-title">${s.name}</div>
          <div class="note-subject">Roll: ${s.rollNo}</div>
          <div class="note-subject">Status: ${s.status.toUpperCase()}</div>
        </div>
      </div>
    `;
  });
};
