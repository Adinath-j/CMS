// js/modules/syllabus.js
window.saveSyllabus = async function () {
  const sem = document.getElementById("syllabusSem").value;
  const subjects = document.getElementById("syllabusSubjects").value
    .split(",")
    .map(s => s.trim());

  const hod = (await db.collection("users").doc(auth.currentUser.uid).get()).data();

  await db.collection("syllabus")
    .doc(`${hod.department}_${sem}`)
    .set({
      department: hod.department,
      semester: sem,
      subjects
    });

  alert("Syllabus saved");
};
