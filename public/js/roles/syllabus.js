/* ===========================================================
   SYLLABUS SYSTEM — HOD / STAFF / STUDENT
   =========================================================== */


/* ================= SAVE / UPDATE SYLLABUS (HOD) ================= */
window.saveSyllabus = async function () {
  const sem = syllabusSem.value;
  const raw = syllabusSubjects.value;

  if (!sem || !raw) return alert("Enter semester and subjects");

  const newSubs = raw.split(",").map(s => s.trim()).filter(Boolean);
  if (!newSubs.length) return;

  const hod = (await db.collection("users").doc(auth.currentUser.uid).get()).data();
  if (hod.role !== "hod") return alert("Only HOD can edit syllabus");

  const key = `${hod.departmentId}_${sem}`;
  const ref = db.collection("syllabus").doc(key);
  const snap = await ref.get();

  let subjects = {};

  // migrate old array syllabus if exists
  if (snap.exists) {
    const old = snap.data().subjects;
    if (Array.isArray(old)) {
      old.forEach(s => subjects[s] = []);
    } else {
      subjects = old || {};
    }
  }

  newSubs.forEach(s => {
    if (!subjects[s]) subjects[s] = [];
  });

await ref.set({
  departmentId: hod.departmentId,
  departmentName: hod.departmentName,
  semester: sem,
  subjects
});

  syllabusSubjects.value = "";
  loadSyllabusUI();
};



/* ================= LOAD HOD SYLLABUS ================= */
window.loadSyllabusUI = async function () {
  const box = document.getElementById("syllabusList");
  if (!box) return;

  box.innerHTML = "";

  const hod = (await db.collection("users").doc(auth.currentUser.uid).get()).data();

  const snap = await db.collection("syllabus")
    .where("department", "==", hod.departmentId)
    .get();

  if (snap.empty) {
    box.innerHTML = `<div class="card">No syllabus created yet</div>`;
    return;
  }

  snap.forEach(doc => {
    let s = doc.data();
    let subjects = s.subjects;

    // Auto migrate broken format
    if (Array.isArray(subjects)) {
      const fixed = {};
      subjects.forEach(sub => fixed[sub] = []);
      subjects = fixed;
      db.collection("syllabus").doc(doc.id).update({ subjects: fixed });
    }

    let cards = "";

    Object.keys(subjects).forEach(sub => {
      cards += `
        <div class="note-card" onclick="openSubjectAdmin('${doc.id}','${sub}')">
          <div class="note-body">
            <div class="note-title">${sub}</div>
            <div class="note-subject">${subjects[sub].length} chapters</div>
          </div>
        </div>
      `;
    });

    box.innerHTML += `
      <h3>Semester ${s.semester}</h3>
      <div class="notes-grid">${cards}</div>
    `;
  });
};



/* ================= HOD: OPEN SUBJECT ================= */
window.openSubjectAdmin = async function (id, subject) {
  const snap = await db.collection("syllabus").doc(id).get();
  const subjects = snap.data().subjects;

  const chapters = Array.isArray(subjects[subject]) ? subjects[subject] : [];

  const box = document.getElementById("syllabusList");

  box.innerHTML = `
    <h3>${subject}</h3>
    <input id="newChapter" class="form-control" placeholder="Add chapter">
    <button class="btn btn-primary" onclick="addChapter('${id}','${subject}')">Add</button>

    <div class="notes-grid">
      ${chapters.map(c => `
        <div class="note-card">
          <div class="note-body">${c}</div>
        </div>
      `).join("")}
    </div>

    <button class="btn btn-outline" onclick="loadSyllabusUI()">⬅ Back</button>
  `;
};



/* ================= ADD CHAPTER ================= */
window.addChapter = async function (id, subject) {
  const ch = newChapter.value.trim();
  if (!ch) return;

  const ref = db.collection("syllabus").doc(id);
  const snap = await ref.get();
  const subjects = snap.data().subjects;

  if (!Array.isArray(subjects[subject])) subjects[subject] = [];
  subjects[subject].push(ch);

  await ref.update({ subjects });

  openSubjectAdmin(id, subject);
};



/* ================= STUDENT & STAFF VIEW ================= */
window.loadStudentSyllabus = async function () {
  const box = document.getElementById("syllabusViewer");
  if (!box) return;

  box.innerHTML = "";

  const me = auth.currentUser;
  const profile = (await db.collection("users").doc(me.uid).get()).data();

  let query = db.collection("syllabus").where("departmentId","==", profile.departmentId)

  // Students only see their semester
  if (profile.role === "student") {
    query = query.where("semester", "==", profile.semester);
  }

  const snap = await query.get();

  if (snap.empty) {
    box.innerHTML = `<div class="card">No syllabus available</div>`;
    return;
  }

  snap.forEach(doc => {
    const s = doc.data();
    const subjects = s.subjects;

    let cards = "";

    Object.keys(subjects).forEach(sub => {
      cards += `
        <div class="note-card" onclick="openSubjectViewer('${sub}','${s.semester}')">
          <div class="note-body">
            <div class="note-title">${sub}</div>
            <div class="note-subject">${subjects[sub].length} chapters</div>
          </div>
        </div>
      `;
    });

    box.innerHTML += `
      <h3>Semester ${s.semester}</h3>
      <div class="notes-grid">${cards}</div>
    `;
  });
};



/* ================= STUDENT: OPEN SUBJECT ================= */
window.openSubjectViewer = async function (subject, semester) {
  const user = auth.currentUser;
  const profile = (await db.collection("users").doc(user.uid).get()).data();

  const snap = await db.collection("notes")
    .where("departmentId","==", profile.departmentId)
    .where("semester", "==", semester)
    .where("subject", "==", subject)
    .where("status", "==", "approved")
    .get();

  const box = document.getElementById("syllabusViewer");

  box.innerHTML = `<h3>${subject}</h3><div class="notes-grid"></div>`;
  const grid = box.querySelector(".notes-grid");

  if (snap.empty) {
    grid.innerHTML = `<div class="card">No notes uploaded yet</div>`;
    return;
  }

  snap.forEach(n => {
    const d = n.data();
    grid.innerHTML += `
      <div class="note-card">
        <div class="note-body">
          <div class="note-title">${d.title}</div>
          <div class="note-subject">${d.chapter || ""}</div>
          <a class="btn btn-primary" href="${d.fileURL}" target="_blank">Open</a>
        </div>
      </div>
    `;
  });
};


window.loadStaffSyllabusOptions = async function () {
  const subSelect = document.getElementById("noteSubject");
  const chSelect = document.getElementById("noteChapter");

  if (!subSelect || !chSelect) return;

  subSelect.innerHTML = "";
  chSelect.innerHTML = "";

  const me = auth.currentUser;
  const profile = (await db.collection("users").doc(me.uid).get()).data();

  // Get all syllabus of this department
  const snap = await db.collection("syllabus")
 .where("departmentId","==", profile.departmentId)
    .get();

  if (snap.empty) {
    subSelect.innerHTML = `<option>No syllabus found</option>`;
    return;
  }

  const syllabusMap = {}; // subject -> chapters

  snap.forEach(doc => {
    const data = doc.data();
    Object.entries(data.subjects).forEach(([subject, chapters]) => {
      if (!syllabusMap[subject]) syllabusMap[subject] = [];
      syllabusMap[subject].push(...chapters);
    });
  });

  // Populate subjects
  Object.keys(syllabusMap).forEach(sub => {
    subSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
  });

  function loadChapters() {
    const subject = subSelect.value;
    chSelect.innerHTML = "";
    (syllabusMap[subject] || []).forEach(ch => {
      chSelect.innerHTML += `<option value="${ch}">${ch}</option>`;
    });
  }

  subSelect.onchange = loadChapters;
  loadChapters();
};
/* ================= LOAD SYLLABUS INTO UPLOAD FORM ================= */
window.loadUploadSyllabus = async function () {
  const subSelect = document.getElementById("noteSubject");
  const chSelect = document.getElementById("noteChapter");

  if (!subSelect || !chSelect) return;

  subSelect.innerHTML = `<option>Loading...</option>`;
  chSelect.innerHTML = "";

  const me = auth.currentUser;
  if (!me) return;

  const profile = (await db.collection("users").doc(me.uid).get()).data();

  const key = `${profile.departmentId || profile.department}_${profile.semester}`;

  const snap = await db.collection("syllabus").doc(key).get();

  if (!snap.exists) {
    subSelect.innerHTML = `<option>No syllabus found</option>`;
    return;
  }

  const subjects = snap.data().subjects;

  subSelect.innerHTML = "";

  Object.keys(subjects).forEach(sub => {
    subSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
  });

  function loadChapters() {
    const sub = subSelect.value;
    chSelect.innerHTML = "";

    (subjects[sub] || []).forEach(ch => {
      chSelect.innerHTML += `<option value="${ch}">${ch}</option>`;
    });
  }

  subSelect.onchange = loadChapters;
  loadChapters();
};
