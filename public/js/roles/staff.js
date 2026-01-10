/* ================= MANAGE MY NOTES ================= */

window.loadManageNotes = async function () {
  try {
    const container = document.getElementById("manageNotes");
    if (!container) return;

    container.className = "notes-grid";
    container.innerHTML = "";

    const user = auth.currentUser;
    if (!user) return;

    const snap = await db.collection("notes")
      .where("uploadedBy", "==", user.uid)
      .where("status", "==", "approved")
      .get();

    if (snap.empty) {
      container.innerHTML = `<div class="card">No approved notes</div>`;
      return;
    }

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

  } catch (err) {
    console.error("loadManageNotes failed:", err);
  }
};



/* ================= STUDENT APPROVALS (STAFF) ================= */

window.loadStudentApprovals = async function () {
  try {
    const box = document.getElementById("studentApprovals");
    if (!box) return;

    box.innerHTML = "";

    const me = auth.currentUser;
    const staff = (await db.collection("users").doc(me.uid).get()).data();

    const snap = await db.collection("approvals")
      .where("role", "==", "student")
      .where("department", "==", staff.department)
      .get();

    if (snap.empty) {
      box.innerHTML = `<div class="card">No pending students</div>`;
      return;
    }

    snap.forEach(doc => {
      const a = doc.data();
      box.innerHTML += `
        <div class="note-card">
          <div class="note-body">
            <div class="note-title">${a.name}</div>
            <div>${a.email}</div>
            <div>Roll: ${a.rollNo}</div>
            <div>Sem: ${a.semester}</div>
          </div>
          <div class="note-footer">
            <button class="btn btn-success" onclick="approveStudent('${doc.id}')">Approve</button>
            <button class="btn btn-danger" onclick="rejectUser('${doc.id}')">Reject</button>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error("loadStudentApprovals failed:", err);
  }
};


window.approveStudent = async function (uid) {
  await db.collection("users").doc(uid).update({ status: "active" });
  await db.collection("approvals").doc(uid).delete();
  loadStudentApprovals();
};



/* ================= ATTENDANCE ================= */

let attendanceBuffer = {};

window.loadAttendanceStudents = async function () {
  try {
    const list = document.getElementById("attendanceList");
    if (!list) return;

    list.innerHTML = "";
    attendanceBuffer = {};

    const user = auth.currentUser;
    const profile = (await db.collection("users").doc(user.uid).get()).data();

    const snap = await db.collection("users")
      .where("role", "==", "student")
      .where("department", "==", profile.department)
      .get();

    if (snap.empty) {
      list.innerHTML = `<div class="card">No students found</div>`;
      return;
    }

    snap.forEach(doc => {
      const s = doc.data();
      attendanceBuffer[doc.id] = "present";

      list.innerHTML += `
        <div class="note-card">
          <div class="note-body">
            <div class="note-title">${s.name}</div>
            <div>Roll: ${s.rollNo}</div>
          </div>
          <div class="note-footer">
            <button class="btn btn-success" onclick="markPresent('${doc.id}')">Present</button>
            <button class="btn btn-danger" onclick="markAbsent('${doc.id}')">Absent</button>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error("loadAttendanceStudents failed:", err);
  }
};


window.markPresent = uid => attendanceBuffer[uid] = "present";
window.markAbsent  = uid => attendanceBuffer[uid] = "absent";


window.submitAttendance = async function () {
  try {
    const subject = document.getElementById("attSubject").value.trim();
    const lecture = document.getElementById("attLecture").value.trim();

    if (!subject || !lecture) return alert("Enter subject & lecture ID");

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
    alert("Attendance submitted");

  } catch (err) {
    console.error("submitAttendance failed:", err);
    alert("Attendance failed");
  }
};


window.loadStaffAttendance = async function () {
  try {
    const box = document.getElementById("attendanceList");
    if (!box) return;

    box.innerHTML = "";

    const me = auth.currentUser;
    const staff = (await db.collection("users").doc(me.uid).get()).data();

    const today = new Date().toISOString().slice(0, 10);
    const lectureKey = `${staff.department}_${today}`;

    const snap = await db.collection("attendance")
      .doc(lectureKey)
      .collection("records")
      .get();

    snap.forEach(doc => {
      const s = doc.data();
      box.innerHTML += `
        <div class="note-card">
          <div class="note-body">
            <div>${s.studentUid}</div>
            <div>${s.subject}</div>
            <div>Status: ${s.status}</div>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error("loadStaffAttendance failed:", err);
  }
};
