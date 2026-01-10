window.templates = {

  /* ================= DASHBOARD ================= */
  dashboard: `
    <div id="dashboard-header" class="card">
      <h2 id="greeting"></h2>
      <p id="profileLine"></p>
    </div>

    <div id="dashboard-stats" class="grid-3"></div>

    <div id="dashboard-content"></div>
  `,

  /* ================= STAFF ================= */
  uploadStaff: `
    <div class="card" style="max-width:600px">
      <h3>Upload Lecture Notes</h3>

      <div class="form-group">
        <label>Title</label>
        <input id="noteTitle" class="form-control">
      </div>

      <div class="form-group">
        <label>Subject</label>
<select id="noteSubject" class="form-control"></select>

<label>Chapter</label>
<select id="noteChapter" class="form-control"></select>

      </div>

      <div class="form-group">
        <label>PDF File</label>
        <input type="file" id="noteFile" class="form-control">
      </div>

      <h4>Reference Links</h4>
      <div id="linksContainer"></div>

      <button class="btn btn-outline" onclick="addLink()">➕ Add Link</button><br><br>
      <button class="btn btn-primary" onclick="uploadNote()">Send for Approval</button>
    </div>
  `,

  /* ================= NOTES ================= */
  approveNotes: `
    <h3 class="section-title">Pending Notes</h3>
    <div id="pendingNotes" class="notes-grid"></div>
  `,

  manageNotes: `
    <h3 class="section-title">All Notes</h3>
    <div id="manageNotes" class="notes-grid"></div>
  `,

  studentNotes: `
    <h3 class="section-title">My Notes</h3>
    <div id="studentNotes" class="notes-grid"></div>
  `,

  /* ================= APPROVALS ================= */
  studentApprovals: `
    <h3 class="section-title">Student Requests</h3>
    <div id="studentApprovals" class="notes-grid"></div>
  `,

  hodStudentApprovals: `
    <h3 class="section-title">Student Approvals</h3>
    <div id="hodStudentApprovals" class="notes-grid"></div>
  `,

  hodStaffApprovals: `
    <h3 class="section-title">Staff Approvals</h3>
    <div id="hodStaffApprovals" class="notes-grid"></div>
  `,

  /* ================= HOD CUSTOMIZE ================= */
  hodCustomize: `
    <h3 class="section-title">College Structure</h3>

    <div class="notes-grid">

      <div class="note-card">
        <div class="note-body">
          <h4>Departments</h4>
          <input id="newDept" class="form-control" placeholder="Add department">
          <button class="btn btn-primary" onclick="addDepartment()">Add</button>
          <div id="deptList"></div>
        </div>
      </div>

      <div class="note-card">
        <div class="note-body">
          <h4>Classes</h4>
          <input id="newClass" class="form-control" placeholder="FY, SY, TY">
          <button class="btn btn-primary" onclick="addClass()">Add</button>
          <div id="classList"></div>
        </div>
      </div>

    </div>
  `,

  /* ================= ATTENDANCE ================= */
  attendanceStaff: `
    <h3 class="section-title">Mark Attendance</h3>

    <div class="card" style="max-width:700px;margin-bottom:20px">
      <label>Semester</label>
      <select id="attSemester" class="form-control">
        <option>1</option><option>2</option><option>3</option><option>4</option>
        <option>5</option><option>6</option><option>7</option><option>8</option>
      </select>

      <label>Lecture ID</label>
      <input id="attLecture" class="form-control" placeholder="DBMS_01">

      <button class="btn btn-primary" onclick="loadAttendanceGrid()">Load Students</button>
    </div>

    <div id="attendanceTable" style="overflow-x:auto"></div>

    <button class="btn btn-success" onclick="submitAttendance()">Submit Attendance</button>
  `,

  staffAttendance: `
    <h3 class="section-title">Today's Attendance</h3>
    <div id="attendanceList" class="notes-grid"></div>
  `,

  /* ================= HOD SYLLABUS ================= */
  hodSyllabus: `
    <h3 class="section-title">Semester Syllabus</h3>

    <div class="card" style="max-width:600px">
      <label>Semester</label>
      <select id="syllabusSem" class="form-control">
        <option>1</option><option>2</option><option>3</option><option>4</option>
        <option>5</option><option>6</option><option>7</option><option>8</option>
      </select>

      <label>Subjects (comma separated)</label>
      <input id="syllabusSubjects" class="form-control" placeholder="DBMS, SE, CN">

      <button class="btn btn-primary" onclick="saveSyllabus()">Save</button>
    </div>

    <div id="syllabusList"></div>
  `, viewSyllabus: `
  <h3 class="section-title">My Syllabus</h3>
  <div id="syllabusViewer"></div>
`,

  hodSyllabus: `
  <h3 class="section-title">Syllabus Admin</h3>

  <div class="card">
    <label>Semester</label>
    <select id="syllabusSem" class="form-control">
      <option>1</option><option>2</option><option>3</option><option>4</option>
      <option>5</option><option>6</option><option>7</option><option>8</option>
    </select>

    <label>Subjects (comma separated)</label>
    <input id="syllabusSubjects" class="form-control" placeholder="DBMS, CN, OS">

    <button class="btn btn-primary" onclick="saveSyllabus()">Add Subjects</button>
  </div>

  <div id="syllabusList"></div>
`,
syllabusViewer: `
  <h3 class="section-title">Syllabus</h3>
  <div id="syllabusViewer" class="notes-grid"></div>
`,


};
