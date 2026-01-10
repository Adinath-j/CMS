window.loadDashboard = async function () {
  const stats = document.getElementById("dashboard-stats");
  const main = document.getElementById("dashboard-content");

  const me = auth.currentUser;
  const snap = await db.collection("users").doc(me.uid).get();
  const profile = snap.data();

  document.getElementById("greeting").innerText =
    `Welcome, ${profile.name}`;

  document.getElementById("profileLine").innerText =
    `${profile.department} • ${profile.role.toUpperCase()}`;

  if (profile.role === "student") return await loadStudentDashboard(profile, stats, main);
  if (profile.role === "staff") return loadStaffDashboard(profile, stats, main);
  if (profile.role === "hod") return loadHodDashboard(profile, stats, main);
};


async function loadStudentDashboard(profile, stats, main) {
  const uid = auth.currentUser.uid;
    if (!stats || !main) return;   // Prevent crash

  const attSnap = await db.collection("attendance").doc(uid).get();
  const att = attSnap.exists ? attSnap.data() : { totalDays: 1, presentDays: 1 };
  const attendance = Math.round((att.presentDays / att.totalDays) * 100);

  const sylKey = `${profile.department}_${profile.semester}`;
  const sylSnap = await db.collection("syllabus_progress").doc(sylKey).get();
  const syl = sylSnap.exists ? sylSnap.data() : { totalUnits: 1, completedUnits: 1 };
  const progress = Math.round((syl.completedUnits / syl.totalUnits) * 100);
  document.getElementById("stat-attendance").innerText = attendance + "%";
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

  main.innerHTML = `<h3>My Notes</h3><div class="notes-grid"></div>`;
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

  const students = await db.collection("users")
    .where("role","==","student")
    .where("department","==",dept)
    .get();

  stats.innerHTML = `
    <div class="card"><h3>Staff Members</h3><div class="stat-number">${staffSnap.size}</div></div>
    <div class="card"><h3>Pending Notes</h3><div class="stat-number">${pendingSnap.size}</div></div>
    <div class="card"><h3>Students</h3><div class="stat-number">${students.size}</div></div>
  `;

  main.innerHTML = `<h3>Staff Overview</h3><div class="notes-grid"></div>`;
  const grid = main.querySelector(".notes-grid");

  staffSnap.forEach(s=>{
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
  const snap = await db.collectionGroup("records")
    .where("studentUid","==",uid)
    .get();

  const total = snap.size;
  const present = snap.docs.filter(d=>d.data().status==="present").length;

  return total === 0 ? 0 : Math.round((present / total) * 100);
}
async function getDepartmentAttendance(dept) {
  const students = await db.collection("users")
    .where("role","==","student")
    .where("department","==",dept)
    .get();

  let total = 0, present = 0;

  for (const s of students.docs) {
    const snap = await db.collectionGroup("records")
      .where("studentUid","==",s.id)
      .get();

    total += snap.size;
    present += snap.docs.filter(d=>d.data().status==="present").length;
  }

  return total === 0 ? 0 : Math.round((present / total) * 100);
}
