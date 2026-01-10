/* -------------------- ROLES -------------------- */

const roles = {
  student: { nav: [{ name: "My Notes", id: "studentNotes" }] },
  staff: {
    nav: [
      { name: "Upload Notes", id: "uploadStaff" },
      { name: "My Notes", id: "manageNotes" }
    ]
  },
  hod: {
    nav: [
      { name: "Approve Notes", id: "approveNotes" },
      { name: "All Notes", id: "manageNotes" }
    ]
  }
};

