document.addEventListener("DOMContentLoaded", () => {

  /* ================== LOGIN ================== */

  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.querySelector("#loginForm input[type=email]").value;
    const password = document.querySelector("#loginForm input[type=password]").value;

    try {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      const uid = cred.user.uid;

      const userDoc = await db.collection("users").doc(uid).get();

      if (!userDoc.exists) {
        alert("No user profile found");
        return;
      }

      const user = userDoc.data();

      if (user.status !== "active") {
        alert("Your account is pending approval");
        await auth.signOut();
        return;
      }

      showDashboard(user);

    } catch (err) {
      alert(err.message);
    }
  });


  /* ================== LOGOUT ================== */

  window.logout = function () {
    auth.signOut().then(() => location.reload());
  };


/* ================== REGISTER UI ================== */

const studentFields = document.getElementById("studentFields");
const staffFields = document.getElementById("staffFields");

if (studentFields) studentFields.style.display = "block";
if (staffFields) staffFields.style.display = "none";

window.toggleRegisterFields = function () {
  const role = document.getElementById("regRole").value;

  if (role === "student") {
    studentFields.style.display = "block";
    staffFields.style.display = "none";
  } else {
    studentFields.style.display = "none";
    staffFields.style.display = "block";
  }
};
/* ================== PAGE TOGGLES ================== */

  window.showRegister = async function () {
    document.getElementById("login-page").classList.add("hidden");
    document.getElementById("register-page").classList.remove("hidden");
    await loadRegisterOptions();
  };

  window.showLogin = function () {
    document.getElementById("register-page").classList.add("hidden");
    document.getElementById("login-page").classList.remove("hidden");
  };


  /* ================== LOAD DROPDOWNS ================== */

  async function loadRegisterOptions() {
    const deptSelect = document.getElementById("regDept");
    const classSelect = document.getElementById("regClass");

    deptSelect.innerHTML = "";
    classSelect.innerHTML = "";

    const depts = await db.collection("config_departments").get();
    depts.forEach(d => {
      deptSelect.innerHTML += `<option value="${d.data().name}">${d.data().name}</option>`;
    });

    const classes = await db.collection("config_classes").get();
    classes.forEach(c => {
      classSelect.innerHTML += `<option value="${c.data().name}">${c.data().name}</option>`;
    });
  }
  /* ================== REGISTER ================== */

  window.registerUser = async function () {
    const name = regName.value.trim();
    const email = regEmail.value.trim();
    const password = regPassword.value;
    const role = regRole.value;
    const department = regDept.value;

    const age = regAge.value;
    const staffIdEl = document.getElementById("regStaffId");
    const staffId = staffIdEl ? staffIdEl.value.trim() : null;
const rollEl = document.getElementById("regRoll");
const classEl = document.getElementById("regClass");
const semEl = document.getElementById("regSem");

const rollNo = rollEl ? rollEl.value.trim() : null;
const studentClass = classEl ? classEl.value : null;
const semester = semEl ? semEl.value.trim() : null;

    if (!name || !email || !password || !department) {
      alert("Fill all required fields");
      return;
    }

    if (role === "student" && (!rollNo || !studentClass || !semester)) {
      alert("Student academic fields required");
      return;
    }
    if ((role === "staff" || role === "hod") && !staffId) {
  alert("Staff ID is required for staff and HOD");
  return;
}

    try {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      const uid = cred.user.uid;

      await db.collection("users").doc(uid).set({
        name,
        age,
        email,
        role,
        department,
        rollNo,
        staffId,
        class: studentClass,
        semester,
        status: "pending"
      });

 await db.collection("approvals").doc(uid).set({
  uid,
  name,
  email,
  age,
  role,
  department,
  rollNo,
  staffId,
  class: studentClass,
  semester,
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
});

      alert("Registration submitted for approval");
      await auth.signOut();
      location.reload();

    } catch (err) {
      alert(err.message);
    }
  };

});
