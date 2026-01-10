window.loadDashboard = async function () {
  const stats = document.getElementById("dashboard-stats");
  const main = document.getElementById("dashboard-content");

  if (!stats || !main) return;

  const me = auth.currentUser;
  const profile = (await db.collection("users").doc(me.uid).get()).data();

  document.getElementById("greeting").innerText = `Welcome, ${profile.name}`;
  document.getElementById("profileLine").innerText =
    `${profile.department} • ${profile.role.toUpperCase()}`;

  if (profile.role === "student") return loadStudentDashboard(profile, stats, main);
  if (profile.role === "staff") return loadStaffDashboard(profile, stats, main);
  if (profile.role === "hod") return loadHodDashboard(profile, stats, main);
};


// ================= STUDENT =================
async function loadStudentDashboard(profile, stats, main) {
  if (!stats || !main) return;

  const uid = auth.currentUser.uid;

  // Attendance
  const attLogs = await db.collection("attendance_logs")
    .where("studentId", "==", uid)
    .get();

  let total = attLogs.size;
  let present = attLogs.docs.filter(d => d.data().status === "present").length;
  const attendance = total ? Math.round((present / total) * 100) : 0;

  // Syllabus progress
  const key = `${profile.department}_${profile.semester}`;
  const sylSnap = await db.collection("syllabus").doc(key).get();
  const subjects = sylSnap.exists ? sylSnap.data().subjects.length : 1;

  const progress = Math.min(100, Math.round((total / (subjects * 10)) * 100));

  // Notifications
  const notiSnap = await db.collection("notifications")
    .where("uid","==",uid)
    .where("read","==",false)
    .get();

  stats.innerHTML = `
    <div class="card"><h3>Attendance</h3><div class="stat-number">${attendance}%</div></div>
    <div class="card"><h3>Course Progress</h3><div class="stat-number">${progress}%</div></div>
    <div class="card"><h3>Notifications</h3><div class="stat-number">${notiSnap.size}</div></div>
  `;

  const notes = await db.collection("notes")
    .where("department","==",profile.department)
    .where("status","==","approved")
    .get();

  main.innerHTML = `<h3>My Subjects</h3><div class="notes-grid"></div>`;
  const grid = main.querySelector(".notes-grid");

  notes.forEach(n=>{
    const d = n.data();
    grid.innerHTML += `
      <div class="note-card">
        <div class="note-body">
          <div class="note-title">${d.title}</div>
          <div class="note-subject">${d.subject}</div>
        </div>
      </div>
    `;
  });
}

// ================= STAFF =================

async function loadStaffDashboard(profile, stats, main) {
  const uid = auth.currentUser.uid;

  const uploads = await db.collection("notes")
    .where("uploadedBy","==",uid)
    .get();

  const requests = await db.collection("student_requests")
    .where("staffId","==",uid)
    .where("status","==","open")
    .get();

  stats.innerHTML = `
    <div class="card"><h3>My Uploads</h3><div class="stat-number">${uploads.size}</div></div>
    <div class="card"><h3>Student Requests</h3><div class="stat-number">${requests.size}</div></div>
    <div class="card"><h3>Department</h3><div class="stat-number">${profile.department}</div></div>
  `;

  main.innerHTML = `
    <div class="card">
      <h3>Quick Upload</h3>
      <button class="btn btn-primary" onclick="loadPage('uploadStaff')">Upload Notes</button>
    </div>
  `;
}


// ================= HOD =================

async function loadHodDashboard(profile, stats, main) {
  const dept = profile.department;

  const staffSnap = await db.collection("users")
    .where("role","==","staff")
    .where("department","==",dept)
    .where("status","==","active")
    .get();

  const pendingSnap = await db.collection("notes")
    .where("department","==",dept)
    .where("status","==","pending")
    .get();

  const deptAttendance = await getDepartmentAttendance(dept);

  stats.innerHTML = `
    <div class="card">
      <h3>Staff Members</h3>
      <div class="stat-number">${staffSnap.size}</div>
    </div>

    <div class="card">
      <h3>Pending Notes</h3>
      <div class="stat-number">${pendingSnap.size}</div>
    </div>

    <div class="card">
      <h3>Dept Attendance</h3>
      <div class="stat-number">${deptAttendance}%</div>
    </div>
  `;

  main.innerHTML = `<h3>Staff Overview</h3><div class="notes-grid"></div>`;
  const grid = main.querySelector(".notes-grid");

  staffSnap.forEach(s => {
    const d = s.data();
    grid.innerHTML += `
      <div class="note-card">
        <div class="note-body">
          <div class="note-title">${d.name}</div>
          <div class="note-subject">${d.department}</div>
        </div>
      </div>
    `;
  });
}

async function getStudentAttendance(uid) {
  const sessions = await db.collection("attendance_sessions").get();

  let total = 0;
  let present = 0;

  for (const s of sessions.docs) {
    const rec = await s.ref.collection("records").doc(uid).get();
    if (rec.exists) {
      total++;
      if (rec.data().status === "present") present++;
    }
  }

  return total === 0 ? 0 : Math.round((present / total) * 100);
}

async function getDepartmentAttendance(dept) {
  const sessions = await db.collection("attendance_sessions")
    .where("department","==",dept)
    .get();

  let total = 0;
  let present = 0;

  for (const s of sessions.docs) {
    const records = await s.ref.collection("records").get();
    records.forEach(r=>{
      total++;
      if (r.data().status === "present") present++;
    });
  }

  return total === 0 ? 0 : Math.round((present / total) * 100);
}
