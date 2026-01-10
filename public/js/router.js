window.roles = {
  student: [
  { name: "Dashboard", id: "dashboard" },
  { name: "My Notes", id: "studentNotes" }
],

staff: [
  { name: "Dashboard", id: "dashboard" },
  { name: "Upload Notes", id: "uploadStaff" },
  { name: "My Notes", id: "manageNotes" },
  { name: "Student Requests", id: "studentApprovals" },
  { name: "Attendance", id: "attendanceStaff" }
],

hod: [
  { name: "Dashboard", id: "dashboard" },
  { name: "Approve Notes", id: "approveNotes" },
  { name: "All Notes", id: "manageNotes" },
  { name: "Student Approvals", id: "hodStudentApprovals" },
  { name: "Staff Approvals", id: "hodStaffApprovals" }
]
};


window.showDashboard = function (user) {
  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("dashboard-layout").classList.remove("hidden");

  document.getElementById("user-name").innerText = user.name;
  document.getElementById("user-role-display").innerText = user.role.toUpperCase();
  document.getElementById("user-initial").innerText = user.name[0];

  const nav = document.getElementById("sidebar-nav");
  nav.innerHTML = "";

  window.roles[user.role].forEach(item => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.innerText = item.name;
    a.onclick = () => loadPage(item.id);
    li.appendChild(a);
    nav.appendChild(li);
  });
  loadPage("dashboard");
};

window.loadPage = async function(pageId) {
  const content = document.getElementById("dynamic-content");

  content.innerHTML = window.templates[pageId] || `<div class="card">Coming soon</div>`;

  // Wait for DOM paint
  await new Promise(r => setTimeout(r, 10));

  if (pageId === "dashboard") await loadDashboard();
  if (pageId === "staffAttendance") loadStaffAttendance();
  if (pageId === "approveNotes") loadPendingNotes();
  if (pageId === "manageNotes") loadManageNotes();
  if (pageId === "studentNotes") loadStudentNotes();
  if (pageId === "studentApprovals") loadStudentApprovals();
  if (pageId === "hodStudentApprovals") loadHodStudentApprovals();
  if (pageId === "hodStaffApprovals") loadHodStaffApprovals();
};
