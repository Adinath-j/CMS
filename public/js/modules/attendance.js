window.loadAttendanceGrid = async function () {
  const sem = document.getElementById("attSemester").value;
  const lectureId = document.getElementById("attLecture").value;

  if (!lectureId) return alert("Enter lecture ID");

  const staff = (await db.collection("users").doc(auth.currentUser.uid).get()).data();

  // Load syllabus
  const syl = await db.collection("syllabus")
    .doc(`${staff.department}_${sem}`)
    .get();

  if (!syl.exists) return alert("No syllabus found for this semester");

  const subjects = syl.data().subjects;

  // Load students
  const students = await db.collection("users")
    .where("role","==","student")
    .where("department","==",staff.department)
    .where("semester","==",sem)
    .get();

  let html = `
    <table class="table-container">
      <tr>
        <th>Roll</th>
        <th>Name</th>
        ${subjects.map(s=>`<th>${s}</th>`).join("")}
      </tr>
  `;

  students.forEach(s=>{
    const d = s.data();
    html += `<tr>
      <td>${d.rollNo}</td>
      <td>${d.name}</td>
      ${subjects.map(sub=>`
        <td>
          <input type="checkbox"
            data-student="${s.id}"
            data-subject="${sub}">
        </td>`).join("")}
    </tr>`;
  });

  html += "</table>";

  document.getElementById("attendanceTable").innerHTML = html;
};



window.submitAttendance = async function () {
  const sem = document.getElementById("attSemester").value;
  const lectureId = document.getElementById("attLecture").value;

  if (!lectureId) return alert("Lecture ID required");

  const staff = (await db.collection("users").doc(auth.currentUser.uid).get()).data();

  const today = new Date().toISOString().slice(0,10);
  const sessionId = `${staff.department}_${sem}_${today}_${lectureId}`;

  // Prevent duplicate lecture
  const sessionRef = db.collection("attendance_sessions").doc(sessionId);
  const existing = await sessionRef.get();
  if (existing.exists) {
    return alert("This lecture already exists");
  }

  const checks = document.querySelectorAll("#attendanceTable input[type=checkbox]");

  const batch = db.batch();

  batch.set(sessionRef,{
    department: staff.department,
    semester: sem,
    lectureId,
    staffId: auth.currentUser.uid,
    date: today,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  checks.forEach(cb=>{
    const studentId = cb.dataset.student;
    const subject = cb.dataset.subject;
    const status = cb.checked ? "present" : "absent";

    const ref = sessionRef.collection("records").doc(studentId);
    batch.set(ref,{
      studentId,
      subject,
      status
    });
  });

  await batch.commit();
  alert("Attendance saved safely");
};
