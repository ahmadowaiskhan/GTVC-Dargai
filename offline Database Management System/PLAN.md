# 🏫 GTVC Dargai — Offline Database Management System
## Government Technical & Vocational Centre Dargai, Malakand

> **Project Overview:**  
> This is an **offline internal management system** for GTVC Dargai. It runs on a local machine (no internet needed).  
> Teachers, Principals, and Admins can add/manage data. All data is stored in a **MySQL database** using a **Node.js** backend.

---

## 📋 Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [File & Folder Structure](#2-file--folder-structure)
3. [Database Schema](#3-database-schema)
4. [Step-by-Step Development Plan](#4-step-by-step-development-plan)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Features List](#6-features-list)
7. [Running Without XAMPP & Custom Folder Location (FAQ)](#7-running-without-xampp--custom-folder-location-faq)

---

## 1. Technology Stack

| Layer        | Technology                        |
|-------------|-----------------------------------|
| Frontend     | HTML, CSS, Vanilla JavaScript     |
| Backend      | Node.js + Express.js              |
| Database     | MySQL (Local server / port 3306)  |
| DB Client    | mysql2 (Connection Pool with Promises) |
| Auth         | bcrypt + JWT (JSON Web Tokens)    |
| File Upload  | Multer (for images/documents)     |
| PDF Export   | PDFKit or html-pdf                |
| Port         | `http://localhost:3000`           |

---

## 2. File & Folder Structure

> **Updated Structure — Simplified to just 4 core files + HTML pages**
> Instead of many confusing folders (routes/, controllers/, middleware/, models/, config/, js/),
> everything is now merged into 4 simple files that are easy to understand.

```
offline Database Management System/
│
├── PLAN.md            ← This planning file
├── FAQ.md             ← Frequently Asked Questions & solutions
├── package.json       ← Node.js packages list
├── .env               ← Settings (port, secret key, MySQL credentials)
├── .gitignore         ← Files to ignore in git
│
│
├── server.js          ← ENTIRE BACKEND in one file
│                         Includes:
│                           - Server startup
│                           - Login / logout (JWT auth)
│                           - Role checking (admin / principal / teacher)
│                           - All API routes (admin, teacher, principal)
│                           - File upload handling (photos)
│
├── database.js        ← ALL DATABASE QUERIES in one file
│                         Includes:
│                           - Create all tables (runs once on startup)
│                           - Insert default admin + courses (seed data)
│                           - Users queries  (login, add, edit, delete)
│                           - Students queries
│                           - Teachers queries
│                           - Courses & Classes queries
│                           - Attendance queries
│                           - Results / Marks queries
│                           - Notices queries
│
├── database/
│   │
│   └── gtvc_db.sql           ← Combined table definitions & initial seed data
│
│
└── public/            ← Everything the browser sees (HTML + CSS + JS)
    │
    ├── index.html     ← Login page (first page that opens)
    │
    ├── style.css      ← ALL CSS styles in one file
    │                     (login page, dashboards, tables, forms)
    │
    ├── app.js         ← ALL FRONTEND JAVASCRIPT in one file
    │                     Includes:
    │                       - Login / logout logic
    │                       - Load and show students
    │                       - Load and show teachers
    │                       - Mark attendance
    │                       - Enter and view results
    │                       - Show notices
    │
    ├── pages/
    │   │
    │   ├── admin/
    │   │   ├── dashboard.html       ← Admin home page
    │   │   │                           (shows totals: students, teachers, etc.)
    │   │   ├── user.html            ← Unified User & Faculty Management (Admin, Teacher, Accounting)
    │   │   ├── manage-students.html ← Add / view / edit students
    │   │   ├── manage-courses.html  ← Add courses and classes
    │   │   ├── notices.html         ← Post a new notice
    │   │   └── reports.html         ← View and print reports
    │   │
    │   ├── principal/
    │   │   ├── dashboard.html       ← Principal home page
    │   │   ├── view-teachers.html   ← See all teachers (read only)
    │   │   ├── view-students.html   ← See all students (read only)
    │   │   ├── view-results.html    ← See all results (read only)
    │   │   ├── view-attendance.html ← See attendance records
    │   │   ├── notices.html         ← Post / view notices
    │   │   └── reports.html         ← Generate and print reports
    │   │
    │   └── teacher/
    │       ├── dashboard.html       ← Teacher home page
    │       ├── my-students.html     ← See students in their class only
    │       ├── attendance.html      ← Mark daily attendance
    │       ├── results.html         ← Enter exam marks
    │       └── notices.html         ← Read notices
    │
    └── assets/
        ├── logo/
        │   └── gtvc-logo.png        ← GTVC Dargai college logo
        └── icons/
            └── favicon.ico          ← Browser tab icon
│
│
└── uploads/           ← All uploaded photos and files saved here
    ├── students/
    │   └── photos/    ← Student passport photos
    ├── teachers/
    │   └── photos/    ← Teacher profile photos
    ├── documents/
    │   ├── certificates/   ← Certificates (PDF)
    │   ├── marksheets/     ← Result marksheets (PDF)
    │   └── notices/        ← Notice attachments (PDF)
    └── temp/               ← Temporary files (auto-deleted)
```

### What Each Core File Does

| File            | What is it?          | What is inside?                                              |
|----------------|----------------------|--------------------------------------------------------------|
| `server.js`    | The entire backend   | Server, login system, role checks, all API routes, uploads   |
| `database.js`  | All database queries | Table creation, seed data, every SQL query for every table   |
| `public/style.css` | All styling      | Login page style, dashboard, tables, forms — all in one      |
| `public/app.js`| All frontend JS      | Login, load data, show tables, mark attendance, enter marks  |

---

## 3. Database Schema

### Tables Overview

```
users               → All login accounts (admin, principal, teacher)
students            → Student records
teachers            → Teacher records (linked to users)
courses             → Trade courses offered (Electrician, Plumber, etc.)
classes             → Individual class batches (Course + Year + Section)
enrollments         → Which student is in which class
attendance          → Daily attendance records
results             → Exam marks per student per subject
subjects            → Subjects per course
notices             → Notice board posts
```

### gtvc_db.sql — Full MySQL Table Definitions

```sql
-- ============================================================
-- GTVC DARGAI - DATABASE SCHEMA (MySQL)
-- ============================================================

CREATE DATABASE IF NOT EXISTS gtvc_db;
USE gtvc_db;

-- 1. USERS TABLE (Login accounts)
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,              -- bcrypt hashed
    full_name   VARCHAR(150) NOT NULL,
    role        ENUM('admin', 'principal', 'teacher') NOT NULL,
    email       VARCHAR(150),
    phone       VARCHAR(50),
    is_active   TINYINT DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. TEACHERS TABLE
CREATE TABLE IF NOT EXISTS teachers (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    employee_id     VARCHAR(50) UNIQUE,            -- e.g. GTVC-T-001
    cnic            VARCHAR(20) UNIQUE,
    date_of_birth   DATE,
    gender          ENUM('male', 'female', 'other'),
    qualification   VARCHAR(150),
    specialization  VARCHAR(150),                   -- e.g. Electrician, Computer
    joining_date    DATE,
    address         TEXT,
    photo_path      VARCHAR(255),                   -- path in uploads/teachers/photos/
    is_active       TINYINT DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. COURSES TABLE (Trade programs)
CREATE TABLE IF NOT EXISTS courses (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    course_name     VARCHAR(150) NOT NULL,          -- e.g. Electrician, Plumber, Computer
    course_code     VARCHAR(50) UNIQUE,
    duration_months INT,
    description     TEXT,
    is_active       TINYINT DEFAULT 1
);

-- 4. CLASSES TABLE (Batch/Section)
CREATE TABLE IF NOT EXISTS classes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    class_name      VARCHAR(150) NOT NULL,          -- e.g. "Electrician Batch-2024-A"
    course_id       INT,
    teacher_id      INT,
    session_year    VARCHAR(50),                    -- e.g. 2024-2025
    start_date      DATE,
    end_date        DATE,
    is_active       TINYINT DEFAULT 1,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

-- 5. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      VARCHAR(50) UNIQUE,            -- e.g. GTVC-S-001
    full_name       VARCHAR(150) NOT NULL,
    father_name     VARCHAR(150),
    cnic            VARCHAR(20) UNIQUE,
    date_of_birth   DATE,
    gender          ENUM('male', 'female', 'other'),
    phone           VARCHAR(50),
    address         TEXT,
    district        VARCHAR(100),
    photo_path      VARCHAR(255),                   -- path in uploads/students/photos/
    admission_date  DATE,
    status          ENUM('active', 'passed', 'dropped', 'absent') DEFAULT 'active',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. ENROLLMENTS TABLE (Student to Class mapping)
CREATE TABLE IF NOT EXISTS enrollments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    student_id  INT NOT NULL,
    class_id    INT NOT NULL,
    roll_number VARCHAR(50),
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_student_class (student_id, class_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- 7. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS subjects (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(150) NOT NULL,
    course_id    INT,
    total_marks  INT DEFAULT 100,
    pass_marks   INT DEFAULT 40,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 8. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS attendance (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    student_id  INT NOT NULL,
    class_id    INT NOT NULL,
    date        DATE NOT NULL,                      -- YYYY-MM-DD
    status      ENUM('present', 'absent', 'leave', 'late') NOT NULL,
    marked_by   INT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_attendance (student_id, class_id, date),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 9. RESULTS TABLE (Exam Marks)
CREATE TABLE IF NOT EXISTS results (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      INT NOT NULL,
    class_id        INT NOT NULL,
    subject_id      INT NOT NULL,
    exam_type       ENUM('monthly', 'midterm', 'final', 'practical') NOT NULL,
    marks_obtained  DECIMAL(5,2),
    total_marks     DECIMAL(5,2) DEFAULT 100.00,
    grade           VARCHAR(10),
    entered_by      INT,
    exam_date       DATE,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 10. NOTICES TABLE
CREATE TABLE IF NOT EXISTS notices (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    content     TEXT NOT NULL,
    posted_by   INT,
    target_role VARCHAR(50) DEFAULT 'all',         -- all / teacher / student
    file_path   VARCHAR(255),
    is_active   TINYINT DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 4. Step-by-Step Development Plan

### Phase 1 — Project Setup (Day 1)

- [ ] Step 1.1 — Create folder structure as shown above
- [ ] Step 1.2 — Initialize Node.js project
  ```bash
  npm init -y
  npm install express mysql2 bcryptjs jsonwebtoken multer dotenv cors
  npm install --save-dev nodemon
  ```
- [ ] Step 1.3 — Create `.env` file with MySQL settings
  ```env
  PORT=3000
  JWT_SECRET=gtvc_dargai_secret_2024
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=
  DB_NAME=gtvc_db
  DB_PORT=3306
  ```
- [ ] Step 1.4 — Setup `server.js` (Express server)
- [ ] Step 1.5 — Setup `database.js` (MySQL connection pool with `mysql2/promise`)
- [ ] Step 1.6 — Import `database/gtvc_db.sql` into MySQL (via phpMyAdmin or MySQL CLI)

---

### Phase 2 — Authentication System (Day 2)

- [ ] Step 2.1 — Build `routes/auth.routes.js`
  - `POST /api/auth/login` — Login with username + password
  - `POST /api/auth/logout` — Clear token
  - `POST /api/auth/change-password` — Change own password
- [ ] Step 2.2 — Build `controllers/auth.controller.js`
  - Hash passwords with bcrypt
  - Generate JWT token on login
  - Verify token on every protected route
- [ ] Step 2.3 — Build `middleware/auth.middleware.js`
  - Check `Authorization: Bearer <token>` header
- [ ] Step 2.4 — Build `middleware/role.middleware.js`
  - Allow or deny based on role (admin, principal, teacher)
- [ ] Step 2.5 — Create `public/index.html` — Login Page (UI)
  - GTVC logo + login form
  - On success: redirect based on role

---

### Phase 3 — Admin Module (Day 3–4)

- [ ] Step 3.1 — Admin Dashboard (`pages/admin/dashboard.html`)
  - Statistics cards: Total Students, Teachers, Courses, Today's Attendance
- [x] Step 3.2 — User & Faculty Management (`pages/admin/user.html`)
  - Add new accounts (Admin, Teacher, Accounting)
  - Edit user info, reset password, update staff details (CNIC, DOB, joining date, etc.)
  - Deactivate/activate and delete accounts
- [ ] Step 3.3 — Course Management (`pages/admin/manage-courses.html`)
  - Add/Edit/Delete trade courses (Electrician, Plumber, Computer, etc.)
  - Assign subjects to courses
- [ ] Step 3.4 — Class Management
  - Create class batches (e.g. Electrician 2024-A)
  - Assign teacher to class
- [ ] Step 3.5 — Notice Board (`pages/admin/notices.html`)
  - Post notices for all or specific roles

---

### Phase 4 — Student Module (Day 5–6)

- [ ] Step 4.1 — Student Registration Form (`pages/admin/manage-students.html`)
  - Fields: Name, Father Name, CNIC, DoB, Gender, Phone, Address, District
  - Photo upload (stores in `uploads/students/photos/`)
  - Auto-generate Student ID (GTVC-S-001, GTVC-S-002...)
- [ ] Step 4.2 — Student Enrollment
  - Enroll student into a class/batch
  - Assign roll number
- [ ] Step 4.3 — Student List / Search / Filter
  - Filter by class, course, status, district
- [ ] Step 4.4 — Student Profile Page
  - View all info, photo, enrolled class, attendance percentage, results

---

### Phase 5 — Teacher Module (Day 7)

- [ ] Step 5.1 — Teacher Registration
  - Fields: Employee ID, CNIC, Qualification, Specialization, Joining Date
  - Photo upload
- [ ] Step 5.2 — Teacher Dashboard (`pages/teacher/dashboard.html`)
  - My Classes, Today's Attendance Status, Recent Notices
- [ ] Step 5.3 — Teacher: My Students
  - List students in their class

---

### Phase 6 — Attendance Module (Day 8)

- [ ] Step 6.1 — Mark Attendance (`pages/teacher/attendance.html`)
  - Select class + date → show student list
  - Mark each student: Present / Absent / Late / Leave
  - Submit all at once
- [ ] Step 6.2 — View Attendance Records
  - Filter by class, date range, student
- [ ] Step 6.3 — Attendance Summary Report
  - Per student: total present / absent / percentage

---

### Phase 7 — Results / Marks Module (Day 9)

- [ ] Step 7.1 — Enter Marks (`pages/teacher/results.html`)
  - Select class + subject + exam type
  - Enter marks per student
  - Auto-calculate grade
- [ ] Step 7.2 — View Results
  - Per student, per subject, per exam
- [ ] Step 7.3 — Result Sheet / Marksheet
  - Generate printable marksheet (PDF export)

---

### Phase 8 — Principal Module (Day 10)

- [ ] Step 8.1 — Principal Dashboard (`pages/principal/dashboard.html`)
  - Overview of all teachers, students, classes
- [ ] Step 8.2 — View all attendance, results (read-only)
- [ ] Step 8.3 — Post notices

---

### Phase 9 — Reports & Export (Day 11)

- [ ] Step 9.1 — Student Report Card (PDF)
- [ ] Step 9.2 — Attendance Report (by class / by month)
- [ ] Step 9.3 — Teacher List Report
- [ ] Step 9.4 — Student Enrollment Summary

---

### Phase 10 — Polish & Testing (Day 12)

- [ ] Step 10.1 — Test all login roles
- [ ] Step 10.2 — Test all CRUD operations
- [ ] Step 10.3 — Test file uploads (photos, documents)
- [ ] Step 10.4 — Validate forms (required fields, formats)
- [ ] Step 10.5 — Make sure UI is responsive
- [ ] Step 10.6 — Backup database file instructions

---

## 5. User Roles & Permissions

| Feature                   | Admin | Principal | Teacher             |
|--------------------------|:-----:|:---------:|:-------------------:|
| Login                    |  YES  |    YES    |  YES                |
| Add/Edit Users           |  YES  |    NO     |  NO                 |
| Add/Edit Courses         |  YES  |    NO     |  NO                 |
| Add/Edit Classes         |  YES  |    NO     |  NO                 |
| Add/Edit Students        |  YES  |    NO     |  NO                 |
| View All Students        |  YES  |    YES    |  YES (own class)    |
| Mark Attendance          |  YES  |    NO     |  YES (own class)    |
| View Attendance          |  YES  |    YES    |  YES (own class)    |
| Enter Results            |  YES  |    NO     |  YES (own class)    |
| View Results             |  YES  |    YES    |  YES (own class)    |
| Post Notices             |  YES  |    YES    |  NO                 |
| View Notices             |  YES  |    YES    |  YES                |
| Generate Reports         |  YES  |    YES    |  NO                 |
| Manage Teacher Records   |  YES  |    NO     |  NO                 |

---

## 6. Features List

### Student Management
- Register new student with photo
- Auto-generate Student ID (GTVC-S-XXX)
- Enroll in class/batch
- View/Edit student profile
- Search and filter students
- Student status tracking (Active / Passed / Dropped)

### Teacher Management
- Add teacher with photo
- Auto-generate Employee ID (GTVC-T-XXX)
- Link teacher to system login
- Assign teacher to class

### Attendance
- Daily attendance marking (Present/Absent/Late/Leave)
- Monthly attendance summary
- Student attendance percentage
- Attendance export to PDF

### Results & Marks
- Enter marks per subject per exam type
- Auto-calculate grade (A/B/C/D/F)
- Cumulative result card
- Print/export marksheet as PDF

### Notice Board
- Admin/Principal can post notices
- Notices visible to relevant roles
- Date-stamped notifications

### Image & File Storage
```
uploads/
├── students/photos/     → Student passport-size photos
├── teachers/photos/     → Teacher profile photos
├── documents/
│   ├── certificates/    → Award/completion certificates
│   ├── marksheets/      → Exported PDF marksheets
│   └── notices/         → PDF files attached to notices
└── temp/                → Temporary uploads
```

### Reports
- Student enrollment report
- Monthly attendance report
- Exam result report
- Teacher and staff list

---

## 7. Running Without XAMPP & Custom Folder Location (FAQ)

### ❓ Can I use this website and database without XAMPP Control Panel?
- **For the Website & Web Server (Node.js): YES!**
  - You do **not** need Apache or XAMPP to run the website. Node.js has its own built-in web server (Express) listening on port 3000.
- **For the MySQL Database:**
  - **Option A (If you have XAMPP):** Open XAMPP Control Panel and click **"Start" next to MySQL**.
  - **Option B (Without XAMPP):** Install standalone **MySQL Community Server** from mysql.com (runs automatically as a Windows Service).
  - **Database GUI:** You can use the **VS Code "MySQL" Extension** (by Weijan Chen) to connect, view tables, and run queries right inside VS Code without any external browser tool!
  - *(See full details in [FAQ.md](file:///c:/Users/A.Owais%20khan/Desktop/GTVC%20Website/offline%20Database%20Management%20System/FAQ.md))*

---

### ❓ Can I store, use, and run this project in ANY folder outside `htdocs`?
**YES, 100% in ANY folder or drive you want!**
- **Why?** The `htdocs` folder (`C:\xampp\htdocs`) is strictly an Apache/PHP requirement.
- **Node.js is completely independent:**
  - You can keep this project on your **Desktop**, in `D:\GTVC Database\`, in `Documents`, or anywhere else.
  - Node.js connects to MySQL over port 3306 directly from whatever folder your project is in.
  - To start the system, simply open a terminal in your project folder and run:
    ```bash
    npm start
    # or
    node server.js
    ```
  - The website opens at `http://localhost:3000`.

---

## Quick Start

```bash
# 1. Start MySQL (via XAMPP Control Panel or MySQL Windows Service)
# 2. Import database/gtvc_db.sql into MySQL (creates gtvc_db)

# 3. Install dependencies
npm install

# 4. Start the server
npm run dev

# 5. Open browser
# http://localhost:3000

# 6. Default login credentials
# Username: admin
# Password: admin123
# (Change immediately after first login!)
```

---

## Important Notes

- All data is stored locally in MySQL — no internet required
- Database: `gtvc_db` on MySQL (port 3306) — backup by exporting from phpMyAdmin or using `mysqldump`
- Uploaded images are in the `uploads/` folder — include in backup!
- To run on multiple computers on the same school network, change `localhost` in browser to the server PC's IP address (e.g. `http://192.168.1.50:3000`)

---

*Project: GTVC Dargai Offline Database Management System*  
*College: Government Technical and Vocational Centre Dargai, Malakand, KPK*  
*Website: https://gtvcdargai.edu.pk*  
*Built with: Node.js + Express + MySQL + HTML/CSS/JS*
