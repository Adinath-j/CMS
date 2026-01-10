document.addEventListener("DOMContentLoaded", () => {

  /* ================== LOGIN ================== */

  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const email = document.querySelector("#loginForm input[type=email]")?.value.trim();
        const password = document.querySelector("#loginForm input[type=password]")?.value;

        if (!email || !password) {
          alert("Enter email and password");
          return;
        }

        const cred = await auth.signInWithEmailAndPassword(email, password);
        const uid = cred.user.uid;

        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) {
          alert("No user profile found");
          await auth.signOut();
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
  }



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
    const role = document.getElementById("regRole")?.value;

    if (!studentFields || !staffFields) return;

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
    document.getElementById("login-page")?.classList.add("hidden");
    document.getElementById("register-page")?.classList.remove("hidden");
    await loadRegisterOptions();
  };

  window.showLogin = function () {
    document.getElementById("register-page")?.classList.add("hidden");
    document.getElementById("login-page")?.classList.remove("hidden");
  };



  /* ================== LOAD DROPDOWNS ================== */

  async function loadRegisterOptions() {
    const deptSelect = document.getElementById("regDept");
    const classSelect = document.getElementById("regClass");

    if (!deptSelect || !classSelect) return;

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
  try {
    const name = document.getElementById("regName")?.value.trim();
    const email = document.getElementById("regEmail")?.value.trim();
    const password = document.getElementById("regPassword")?.value;
    const role = document.getElementById("regRole")?.value;
    const department = document.getElementById("regDept")?.value;

    const age = document.getElementById("regAge")?.value || "";

    const rollNo = document.getElementById("regRoll")?.value?.trim() || "";
    const studentClass = document.getElementById("regClass")?.value || "";
    const semester = document.getElementById("regSem")?.value || "";

    const staffId = document.getElementById("regStaffId")?.value?.trim() || "";

    // ---------- Validation ----------
    if (!name || !email || !password || !role || !department) {
      alert("Please fill all required fields");
      return;
    }

    if (role === "student") {
      if (!rollNo || !studentClass || !semester) {
        alert("Please fill all student academic fields");
        return;
      }
    }

    if (role === "staff" || role === "hod") {
      if (!staffId) {
        alert("Staff ID is required for staff and HOD");
        return;
      }
    }

    // ---------- Create Auth ----------
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;

    // ---------- Save User Profile ----------
    await db.collection("users").doc(uid).set({
      name,
      email,
      age,
      role,
      department,
      rollNo,
      staffId,
      class: studentClass,
      semester,
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // ---------- Add to approval queue ----------
    await db.collection("approvals").doc(uid).set({
      uid,
      name,
      email,
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
    console.error(err);
    alert(err.message);
  }
};


});
