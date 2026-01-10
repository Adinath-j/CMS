// ================= ROUTER =================

window.showDashboard = function (user) {
  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("dashboard-layout").classList.remove("hidden");

  document.getElementById("user-name").innerText = user.name;
  document.getElementById("user-role-display").innerText = user.role.toUpperCase();
  document.getElementById("user-initial").innerText = user.name[0];

  const nav = document.getElementById("sidebar-nav");
  nav.innerHTML = "";

  // 🔥 CORRECT ROLE SOURCE
  const roleNav = window.ROLES?.[user.role] || [];

  roleNav.forEach(item => {
    const li = document.createElement("li");
    const a = document.createElement("a");

    a.innerText = item.name;
    a.onclick = () => loadPage(item.id);

    li.appendChild(a);
    nav.appendChild(li);
  });

  loadPage("dashboard");
};
// ================= PAGE LOADER =================
window.loadPage = async function (pageId) {
  const content = document.getElementById("dynamic-content");

  content.innerHTML = window.templates?.[pageId] || `<div class="card">Coming soon</div>`;

  // Let browser paint DOM before JS runs
  await new Promise(r => setTimeout(r, 30));

  try {
    switch (pageId) {
      case "dashboard":
        await window.loadDashboard?.();
        break;

      case "staffAttendance":
        await window.loadStaffAttendance?.();
        break;

      case "approveNotes":
        await window.loadPendingNotes?.();
        break;

      case "manageNotes":
        await window.loadManageNotes?.();
        break;

      case "studentNotes":
        await window.loadStudentNotes?.();
        break;

      case "studentApprovals":
        await window.loadStudentApprovals?.();
        break;

      case "hodStudentApprovals":
        await window.loadHodStudentApprovals?.();
        break;

      case "hodStaffApprovals":
        await window.loadHodStaffApprovals?.();
        break;

      case "hodCustomize":
        await window.loadHodCustomize?.();
        break;

      case "hodSyllabus":
        await window.loadSyllabusUI?.();
        break;

      case "uploadStaff":
        await window.loadStaffSyllabusOptions?.();  // 🔥 must await
        break;

      case "viewSyllabus":
        await window.loadStudentSyllabus?.();
        break;
    }

  } catch (err) {
    console.error("Page load failed:", err);
    content.innerHTML = `<div class="card">This section failed to load</div>`;
  }
};
