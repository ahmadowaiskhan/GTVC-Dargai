/* ============================================================
   GTVC Dargai — Offline Database Management System
   server.js — Complete Backend Server
   Express.js + MySQL (mysql2/promise) + JWT + bcryptjs + Multer
   ============================================================ */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cp = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'gtvc_dargai_secret_key_2024_change_this';

// ==================== ENSURE DIRECTORIES EXIST ====================
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'students'),
  path.join(__dirname, 'uploads', 'teachers'),
  path.join(__dirname, 'uploads', 'documents', 'attendance')
];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ==================== MULTER UPLOAD SETUP ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = path.join(__dirname, 'uploads');
    if (file.fieldname === 'student_photo') dest = path.join(dest, 'students');
    else if (file.fieldname === 'teacher_photo') dest = path.join(dest, 'teachers');
    else if (file.fieldname === 'report_file') dest = path.join(__dirname, 'uploads', 'documents', 'attendance');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets from public/ and uploads/
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== DATABASE CONNECTION POOL ====================
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gtvc_db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;
let isDbConnected = false;

async function initDatabase() {
  try {
    // 1. First test connection without database to create gtvc_db if missing
    const rootConn = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await rootConn.end();

    // 2. Create the connection pool
    pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();

    // 3. Create all required tables if they don't exist
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        role ENUM('admin', 'principal', 'teacher', 'accounting') NOT NULL,
        email VARCHAR(150),
        phone VARCHAR(50),
        is_active TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Teachers table deprecated — teacher details now live directly in the users table.

    await conn.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_name VARCHAR(150) NOT NULL,
        course_id INT NULL,
        teacher_id INT NULL,
        session_year VARCHAR(50),
        start_date DATE,
        end_date DATE,
        is_active TINYINT DEFAULT 1
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(50) UNIQUE,
        full_name VARCHAR(150) NOT NULL,
        father_name VARCHAR(150),
        cnic VARCHAR(20) UNIQUE,
        date_of_birth DATE,
        gender ENUM('male', 'female', 'other'),
        phone VARCHAR(50),
        address TEXT,
        district VARCHAR(100),
        photo_path VARCHAR(255),
        admission_date DATE,
        status ENUM('active', 'passed', 'dropped', 'absent') DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        class_id INT NOT NULL,
        roll_number VARCHAR(50),
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_student_class (student_id, class_id)
      );
    `);

    // Legacy daily `attendance` table removed — replaced by attendance_reports below
    await conn.query('DROP TABLE IF EXISTS attendance;');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        class_id INT NOT NULL,
        subject_id INT NOT NULL,
        exam_type ENUM('monthly', 'midterm', 'final', 'practical') NOT NULL,
        marks_obtained DECIMAL(5,2),
        total_marks DECIMAL(5,2) DEFAULT 100.00,
        grade VARCHAR(10),
        entered_by INT NULL,
        exam_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // notices table removed

    // Recycle Bin — stores soft-deleted records
    await conn.query(`
      CREATE TABLE IF NOT EXISTS recycle_bin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_table VARCHAR(100) NOT NULL,
        original_id INT NOT NULL,
        record_data JSON NOT NULL,
        deleted_by INT NULL,
        deleted_by_name VARCHAR(150),
        deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Edit Log — tracks all edits for audit trail
    await conn.query(`
      CREATE TABLE IF NOT EXISTS edit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target_table VARCHAR(100) NOT NULL,
        target_id INT NOT NULL,
        action ENUM('create', 'update', 'delete', 'restore') NOT NULL,
        old_data JSON,
        new_data JSON,
        edited_by INT NULL,
        edited_by_name VARCHAR(150),
        description VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Accounting Transactions Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS accounting_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'Cash',
        receipt_number VARCHAR(100),
        receipt_image LONGTEXT,
        receipt_date DATE NOT NULL,
        paid_to_or_from VARCHAR(150),
        description TEXT,
        recorded_by INT NULL,
        recorded_by_name VARCHAR(150),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Monthly Attendance Reports — submitted by teachers (with .xlsx file)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS attendance_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_id INT NOT NULL,
        teacher_id INT NULL,
        month TINYINT NOT NULL,
        year SMALLINT NOT NULL,
        percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
        total_students INT NOT NULL DEFAULT 0,
        file_name VARCHAR(255),
        file_path VARCHAR(255),
        submitted_by INT NULL,
        submitted_by_name VARCHAR(150),
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_report (class_id, month, year),
        CONSTRAINT ar_ibfk_1 FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE
      );
    `);

    // Admin Notifications — persistent alerts shown to admin (e.g. missing monthly reports)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL DEFAULT 'general',
        dedupe_key VARCHAR(150) NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        is_read TINYINT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_dedupe (dedupe_key)
      );
    `);

    // User Activity Timeline Table — tracks user login/logout/usage sessions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_activity_timeline (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        username VARCHAR(100) NOT NULL,
        full_name VARCHAR(150),
        role VARCHAR(50),
        login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        logout_time DATETIME NULL,
        duration_minutes INT DEFAULT NULL,
        ip_address VARCHAR(50) DEFAULT '127.0.0.1',
        user_agent TEXT,
        status ENUM('active', 'logged_out', 'session_timeout') DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // site_settings table removed

    // Ensure students table has full student details columns
    const addCol = async (tbl, col, def) => {
      try {
        const [c] = await conn.query(`SHOW COLUMNS FROM \`${tbl}\` LIKE ?`, [col]);
        if (c.length === 0) {
          await conn.query(`ALTER TABLE \`${tbl}\` ADD COLUMN \`${col}\` ${def}`);
        }
      } catch (e) { /* ignore */ }
    };
    // Ensure students table has full student details columns
    await addCol('students', 'email', 'VARCHAR(150)');
    await addCol('students', 'applied_course_id', 'INT NULL');
    await addCol('students', 'applied_date', 'DATE NULL');
    await addCol('students', 'degree_status', "ENUM('enrolled', 'in_progress', 'completed', 'degree_awarded', 'dropped') DEFAULT 'enrolled'");
    await addCol('students', 'completion_date', 'DATE NULL');
    await addCol('students', 'study_plan', 'TEXT NULL');
    await addCol('students', 'projects', 'TEXT NULL');

    // Ensure users table has full staff/profile details (Employee ID, CNIC, DOB, Joining Date, Qualification, Specialization, Gender, Address)
    await addCol('users', 'employee_id', 'VARCHAR(50) NULL');
    await addCol('users', 'cnic', 'VARCHAR(30) NULL');
    await addCol('users', 'date_of_birth', 'DATE NULL');
    await addCol('users', 'joining_date', 'DATE NULL');
    await addCol('users', 'gender', "ENUM('male', 'female', 'other') NULL");
    await addCol('users', 'qualification', 'VARCHAR(150) NULL');
    await addCol('users', 'specialization', 'VARCHAR(150) NULL');
    await addCol('users', 'address', 'TEXT NULL');
    await addCol('users', 'photo_path', 'VARCHAR(255) NULL');

    // Teacher details now stored in the users table; teachers table is migrated & dropped in a later step.

    // 4. Seed default admin if table is empty
    const [existingUsers] = await conn.query('SELECT id FROM users LIMIT 1');
    if (existingUsers.length === 0) {
      const defaultPasswordHash = await bcrypt.hash('admin123', 10);
      await conn.query(
        `INSERT INTO users (username, password, full_name, role, phone) VALUES (?, ?, ?, ?, ?)`,
        ['admin', defaultPasswordHash, 'System Administrator', 'admin', '0300-0000000']
      );
      console.log('✅ Default admin account created (username: admin, password: admin123)');
    }

    // 5. Courses module removed — no course seeding

    // 6. Academic Sessions Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS academic_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_name VARCHAR(150) NOT NULL,
        session_code VARCHAR(50) UNIQUE,
        start_date DATE,
        end_date DATE,
        status ENUM('upcoming', 'active', 'completed') DEFAULT 'active',
        total_admissions INT DEFAULT 0,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Ensure session_id and subject_code columns exist
    await addCol('students', 'session_id', 'INT NULL');
    await addCol('classes', 'session_id', 'INT NULL');

    // Seed default academic sessions if empty
    const [sessCount] = await conn.query('SELECT COUNT(*) as count FROM academic_sessions');
    if (sessCount[0].count === 0) {
      await conn.query(`
        INSERT INTO academic_sessions (session_name, session_code, start_date, end_date, status, total_admissions, description) VALUES
        ('Session 2024-2025 (Annual)', 'SESS-2024-25', '2024-09-01', '2025-08-31', 'active', 155, 'Current active academic batch for all regular vocational and technical trades.'),
        ('Session 2023-2024 (Annual)', 'SESS-2023-24', '2023-09-01', '2024-08-31', 'completed', 142, 'Completed academic session. All board exams finished, diplomas verified.'),
        ('Session 2022-2023 (Annual)', 'SESS-2022-23', '2022-09-01', '2023-08-31', 'completed', 126, 'Past completed session. Certificates awarded.'),
        ('Session 2025-2026 (Upcoming)', 'SESS-2025-26', '2025-09-01', '2026-08-31', 'upcoming', 0, 'Upcoming admission campaign scheduled for Autumn 2025.');
      `);
      console.log('✅ Default Academic Sessions seeded');
    }

    // Subjects module removed — no subject seeding

    // Seed sample students into the active session if students table is empty
    const [stCount] = await conn.query('SELECT COUNT(*) as count FROM students');
    if (stCount[0].count === 0) {
      const [[activeSess]] = await conn.query("SELECT id FROM academic_sessions WHERE status = 'active' LIMIT 1");
      const activeSessId = activeSess ? activeSess.id : 1;
      const cMap = {};

      const sampleStudents = [
        { id: 'STU-2024-001', name: 'Muhammad Usman Khan', father: 'Tariq Khan', cnic: '15402-1234567-1', phone: '0300-1112233', course: 'DIT' },
        { id: 'STU-2024-002', name: 'Ahmad Bilal', father: 'Muhammad Zahir', cnic: '15402-2345678-3', phone: '0301-2223344', course: 'DIT' },
        { id: 'STU-2024-003', name: 'Sohail Ahmad', father: 'Bakhtiar Ahmad', cnic: '15402-3456789-5', phone: '0302-3334455', course: 'DIT' },
        { id: 'STU-2024-004', name: 'Hamza Farooq', father: 'Farooq Shah', cnic: '15402-4567890-7', phone: '0303-4445566', course: 'CCVT' },
        { id: 'STU-2024-005', name: 'Zia Ullah', father: 'Inayat Ullah', cnic: '15402-5678901-9', phone: '0304-5556677', course: 'CCVT' },
        { id: 'STU-2024-006', name: 'Kamran Ali', father: 'Sher Ali', cnic: '15402-6789012-1', phone: '0305-6667788', course: 'GIT' },
        { id: 'STU-2024-007', name: 'Noman Khan', father: 'Said Rahman', cnic: '15402-7890123-3', phone: '0306-7778899', course: 'GIT' },
        { id: 'STU-2024-008', name: 'Asad Iqbal', father: 'Iqbal Hussain', cnic: '15402-8901234-5', phone: '0307-8889900', course: 'ELC' },
        { id: 'STU-2024-009', name: 'Rashid Mehmood', father: 'Mehmood Jan', cnic: '15402-9012345-7', phone: '0308-9990011', course: 'COM' }
      ];

      for (const st of sampleStudents) {
        const cId = cMap[st.course] || null;
        await conn.query(
          `INSERT INTO students (student_id, full_name, father_name, cnic, phone, applied_course_id, session_id, admission_date, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, '2024-09-15', 'active')`,
          [st.id, st.name, st.father, st.cnic, st.phone, cId, activeSessId]
        );
      }
      console.log('✅ Sample students seeded with DIT, CCVT, GIT, ELC, COM courses');
    }

    // 7 & 8. Courses and Subjects modules already removed — their tables no longer exist, so no action needed here.

    // 9. Teachers module deprecated: teacher details live in users.
    //    Backfill users from teachers, re-point teacher links (teachers.id -> users.id), then drop teachers.
    try {
      const [tTab] = await conn.query(
        `SELECT COUNT(*) AS c FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'teachers'`,
        [process.env.DB_NAME || 'gtvc_db']
      );
      if (tTab[0].c > 0) {
        // First drop any FKs that reference teachers so we can re-point the link columns freely
        const [fkRows3] = await conn.query(
          `SELECT TABLE_NAME AS tbl, CONSTRAINT_NAME AS cname
           FROM information_schema.KEY_COLUMN_USAGE
           WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME = 'teachers'`,
          [process.env.DB_NAME || 'gtvc_db']
        );
        for (const f of fkRows3) {
          try { await conn.query(`ALTER TABLE \`${f.tbl}\` DROP FOREIGN KEY \`${f.cname}\``); } catch (e) { /* ignore */ }
        }
        // Backfill any teacher-only details into users
        const [allT] = await conn.query('SELECT * FROM teachers WHERE user_id IS NOT NULL');
        for (const t of allT) {
          await conn.query(`
            UPDATE users SET
              employee_id    = COALESCE(employee_id, ?),
              cnic           = COALESCE(cnic, ?),
              date_of_birth  = COALESCE(date_of_birth, ?),
              joining_date   = COALESCE(joining_date, ?),
              gender         = COALESCE(gender, ?),
              qualification  = COALESCE(qualification, ?),
              specialization = COALESCE(specialization, ?),
              address        = COALESCE(address, ?),
              photo_path     = COALESCE(photo_path, ?)
            WHERE id = ?
          `, [t.employee_id, t.cnic, t.date_of_birth, t.joining_date, t.gender, t.qualification, t.specialization, t.address, t.photo_path, t.user_id]);
        }
        // Re-point links that used teachers.id so they now use the teacher's users.id
        try { await conn.query('UPDATE classes c JOIN teachers t ON c.teacher_id = t.id SET c.teacher_id = t.user_id'); } catch (e) { console.log('⚠️ classes.teacher_id migration skipped:', e.message); }
        try { await conn.query('UPDATE attendance_reports r JOIN teachers t ON r.teacher_id = t.id SET r.teacher_id = t.user_id'); } catch (e) { console.log('⚠️ attendance_reports.teacher_id migration skipped:', e.message); }
        await conn.query('DROP TABLE IF EXISTS teachers');
        console.log('✅ teachers table removed (details merged into users)');
      }
    } catch (e) { console.log('⚠️ teachers merge/drop skipped:', e.message); }

    conn.release();
    isDbConnected = true;
    console.log('✅ MySQL Database Connected successfully to ' + dbConfig.database);
  } catch (err) {
    isDbConnected = false;
    console.warn('⚠️ MySQL connection warning: Unable to connect to MySQL database at ' + dbConfig.host + ':' + dbConfig.port);
    console.warn('   Reason: ' + err.message);
    console.warn('   Ensure MySQL (e.g. XAMPP / MariaDB / MySQL Server) is running.');
  }
}

// Database query helper with error wrapping
async function query(sql, params = []) {
  if (!pool || !isDbConnected) {
    throw new Error('Database is currently offline. Please ensure MySQL is running.');
  }
  const [rows] = await pool.query(sql, params);
  return rows;
}

// ==================== AUTHENTICATION MIDDLEWARE ====================

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token provided' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token expired or invalid' });
  }
}

function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
}

// ==================== AUTH ROUTES ====================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Offline Demo / Fallback if database is not running
    if (!isDbConnected) {
      if (username === 'admin' && password === 'admin123') {
        const dummyUser = { id: 1, username: 'admin', full_name: 'Administrator (Offline Demo)', role: 'admin' };
        const token = jwt.sign(dummyUser, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ message: 'Logged in (Offline Demo Mode)', token, user: dummyUser });
      }
      return res.status(503).json({ message: 'Database is offline. Start MySQL to log in with custom users.' });
    }

    const rows = await query('SELECT * FROM users WHERE username = ? LIMIT 1', [username.trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ message: 'This account has been deactivated. Contact the administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      email: user.email,
      phone: user.phone
    };

    let sessionId = null;
    try {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Browser';
      const logRes = await query(
        `INSERT INTO user_activity_timeline (user_id, username, full_name, role, login_time, ip_address, user_agent, status)
         VALUES (?, ?, ?, ?, NOW(), ?, ?, 'active')`,
        [user.id, user.username, user.full_name, user.role, String(clientIp), String(userAgent).substring(0, 500)]
      );
      sessionId = logRes.insertId;
    } catch (e) {
      console.warn('Could not log login timeline:', e.message);
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      sessionId,
      user: payload
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login: ' + err.message });
  }
});

// POST /api/auth/signup & POST /api/auth/register
const handleSignup = async (req, res) => {
  try {
    const { username, password, full_name, role, email, phone } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Full name, username, and password are required' });
    }

    const validRoles = ['admin', 'principal', 'teacher', 'accounting'];
    const assignedRole = validRoles.includes(role) ? role : 'teacher';

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    if (!isDbConnected) {
      return res.status(503).json({ success: false, message: 'Database is currently offline. Please start MySQL to sign up.' });
    }

    // Check if username already exists
    const existing = await query('SELECT id FROM users WHERE username = ? LIMIT 1', [username.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username is already taken. Please choose another one.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await query(
      `INSERT INTO users (username, password, full_name, role, email, phone, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [username.trim(), hashedPassword, full_name.trim(), assignedRole, email ? email.trim() : null, phone ? phone.trim() : null]
    );

    const newUserId = result.insertId;

    // Teacher details now live directly in the users table — no separate teacher profile row.

    const payload = {
      id: newUserId,
      username: username.trim(),
      full_name: full_name.trim(),
      role: assignedRole,
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: payload
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error during signup: ' + err.message });
  }
};

app.post('/api/auth/signup', handleSignup);
app.post('/api/auth/register', handleSignup);

// GET /api/auth/me
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    if (!isDbConnected) {
      return res.json({ user: req.user });
    }
    const rows = await query('SELECT id, username, full_name, role, email, phone, is_active, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const { sessionId, userId, username } = req.body || {};
    if (isDbConnected) {
      if (sessionId) {
        await query(`
          UPDATE user_activity_timeline
          SET logout_time = NOW(),
              duration_minutes = TIMESTAMPDIFF(MINUTE, login_time, NOW()),
              status = 'logged_out'
          WHERE id = ? AND logout_time IS NULL
        `, [sessionId]);
      } else if (userId || username) {
        await query(`
          UPDATE user_activity_timeline
          SET logout_time = NOW(),
              duration_minutes = TIMESTAMPDIFF(MINUTE, login_time, NOW()),
              status = 'logged_out'
          WHERE (user_id = ? OR username = ?) AND logout_time IS NULL
          ORDER BY id DESC LIMIT 1
        `, [userId || 0, username || '']);
      }
    }
  } catch (e) {
    console.warn('Error recording logout timeline:', e.message);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// POST /api/auth/session-heartbeat (tracks active duration)
app.post('/api/auth/session-heartbeat', async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (sessionId && isDbConnected) {
      await query(`
        UPDATE user_activity_timeline
        SET duration_minutes = TIMESTAMPDIFF(MINUTE, login_time, NOW())
        WHERE id = ? AND logout_time IS NULL
      `, [sessionId]);
    }
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false });
  }
});

// POST /api/auth/verify-gate — Re-authenticates username and password specifically for timeline page gate
app.post('/api/auth/verify-gate', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    if (!isDbConnected) {
      if (username === 'admin' && password === 'admin123') {
        return res.json({ success: true, user: { username: 'admin', role: 'admin' } });
      }
      return res.status(503).json({ success: false, message: 'Database is offline' });
    }
    const rows = await query('SELECT * FROM users WHERE username = ? LIMIT 1', [username.trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Invalid password details provided' });
    }
    const rows = await query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, rows[0].password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password = ? WHERE id = ?', [newHash, req.user.id]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== ADMIN ROUTES ====================

// GET /api/admin/dashboard
app.get('/api/admin/dashboard', authenticate, authorize(['admin']), async (req, res) => {
  try {
    if (!isDbConnected) {
      return res.json({ totalStudents: 0, totalTeachers: 0, totalCourses: 0, todayAttendance: 0 });
    }
    const [[{ totalStudents }]] = await pool.query('SELECT COUNT(*) as totalStudents FROM students WHERE status = "active"');
    const [[{ totalTeachers }]] = await pool.query("SELECT COUNT(*) as totalTeachers FROM users WHERE role = 'teacher' AND is_active = 1");
    const totalCourses = 0; // Courses module removed

    // Daily attendance table removed; today's rate is no longer tracked
    const todayAttendance = 0;

    res.json({
      totalStudents,
      totalTeachers,
      totalCourses,
      todayAttendance
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Users CRUD (Admin) - Full profiles (Admin, Teacher, Accounting)
app.get('/api/admin/users', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const users = await query(`
      SELECT id, username, full_name, role, email, phone, is_active,
             employee_id, cnic, date_of_birth, joining_date, gender,
             qualification, specialization, address, created_at, updated_at
      FROM users 
      ORDER BY id DESC
    `);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== USER ACTIVITY TIMELINE ROUTES ====================
// GET /api/admin/time-line & /api/admin/user-timeline — Returns timeline session logs
const handleGetTimeline = async (req, res) => {
  try {
    if (!isDbConnected) {
      return res.json([]);
    }
    const { username, role, date, exclude_staff } = req.query;
    let sql = 'SELECT * FROM user_activity_timeline WHERE 1=1';
    const params = [];

    if (username) {
      sql += ' AND (username LIKE ? OR full_name LIKE ?)';
      params.push(`%${username.trim()}%`, `%${username.trim()}%`);
    }
    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (exclude_staff === 'true') {
      sql += " AND role NOT IN ('teacher', 'admin')";
    }
    if (date) {
      sql += ' AND DATE(login_time) = ?';
      params.push(date);
    }

    sql += ' ORDER BY login_time DESC LIMIT 500';
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching timeline: ' + err.message });
  }
};

app.get('/api/admin/time-line', authenticate, authorize(['admin']), handleGetTimeline);
app.get('/api/admin/user-timeline', authenticate, authorize(['admin']), handleGetTimeline);

// POST /api/admin/time-line & /api/admin/user-timeline — Manual session entry
const handlePostTimeline = async (req, res) => {
  try {
    const { username, full_name, role, login_time, logout_time, notes } = req.body;
    if (!username || !login_time) {
      return res.status(400).json({ success: false, message: 'Username and login time are required' });
    }

    const [userRows] = await pool.query('SELECT id, full_name, role FROM users WHERE username = ? LIMIT 1', [username.trim()]);
    const u = userRows[0] || {};

    const status = logout_time ? 'logged_out' : 'active';
    const result = await query(
      `INSERT INTO user_activity_timeline (user_id, username, full_name, role, login_time, logout_time, duration_minutes, user_agent, status)
       VALUES (?, ?, ?, ?, ?, ?, IF(? IS NOT NULL, TIMESTAMPDIFF(MINUTE, ?, ?), NULL), ?, ?)`,
      [
        u.id || null,
        username.trim(),
        full_name || u.full_name || username.trim(),
        role || u.role || 'user',
        login_time,
        logout_time || null,
        logout_time || null,
        login_time,
        logout_time || null,
        notes || 'Manual Admin Log',
        status
      ]
    );

    res.status(201).json({ success: true, message: 'Timeline record logged', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

app.post('/api/admin/time-line', authenticate, authorize(['admin']), handlePostTimeline);
app.post('/api/admin/user-timeline', authenticate, authorize(['admin']), handlePostTimeline);

// DELETE /api/admin/time-line/:id & /api/admin/user-timeline/:id
const handleDeleteTimeline = async (req, res) => {
  try {
    await query('DELETE FROM user_activity_timeline WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Timeline record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

app.delete('/api/admin/time-line/:id', authenticate, authorize(['admin']), handleDeleteTimeline);
app.delete('/api/admin/user-timeline/:id', authenticate, authorize(['admin']), handleDeleteTimeline);

app.post('/api/admin/users', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const {
      username, password, full_name, role, email, phone,
      employee_id, cnic, date_of_birth, joining_date, gender,
      qualification, specialization, address, is_active
    } = req.body;

    if (!username || !password || !full_name || !role) {
      return res.status(400).json({ message: 'Username, password, full name, and role are required.' });
    }
    if (password.trim().length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const hash = await bcrypt.hash(password.trim(), 10);
    const result = await query(
      `INSERT INTO users (username, password, full_name, role, email, phone, employee_id, cnic, date_of_birth, joining_date, gender, qualification, specialization, address, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, 1))`,
      [
        username.trim(), hash, full_name.trim(), role,
        email ? email.trim() : null, phone ? phone.trim() : null,
        employee_id ? employee_id.trim() : null, cnic ? cnic.trim() : null,
        date_of_birth || null, joining_date || null, gender || null,
        qualification ? qualification.trim() : null, specialization ? specialization.trim() : null,
        address ? address.trim() : null, is_active !== undefined ? is_active : 1
      ]
    );

    const newUserId = result.insertId;

    // All user details (incl. teacher profile fields) are stored directly in the users table.

    // Log to edit_log
    try {
      await query(
        `INSERT INTO edit_log (target_table, target_id, action, old_data, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'create', NULL, ?, ?, ?, ?)`,
        ['users', newUserId, JSON.stringify({ username, full_name, role, email, phone, employee_id, cnic }), req.user.id, req.user.full_name, `Created ${role} user account "${full_name}" (${username})`]
      );
    } catch (le) {}

    res.status(201).json({ success: true, id: newUserId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username or Employee ID / CNIC already exists in the system.' });
    }
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/users/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const {
      username, full_name, role, email, phone, password, is_active,
      employee_id, cnic, date_of_birth, joining_date, gender,
      qualification, specialization, address
    } = req.body;
    const userId = req.params.id;

    // Fetch previous data for audit/rollback
    const oldRows = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (oldRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const oldRec = { ...oldRows[0] };
    delete oldRec.password;

    await query(
      `INSERT INTO edit_log (target_table, target_id, action, old_data, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'update', ?, ?, ?, ?, ?)`,
      ['users', userId, JSON.stringify(oldRec), JSON.stringify({ username, full_name, role, email, phone, is_active, employee_id, cnic }), req.user.id, req.user.full_name, `Updated user "${full_name}" (${username})`]
    );

    if (password && password.trim().length >= 6) {
      const hash = await bcrypt.hash(password.trim(), 10);
      await query(
        `UPDATE users SET username=?, full_name=?, role=?, email=?, phone=?, password=?, is_active=COALESCE(?, is_active), employee_id=?, cnic=?, date_of_birth=?, joining_date=?, gender=?, qualification=?, specialization=?, address=? WHERE id=?`,
        [
          username, full_name, role, email || null, phone || null, hash,
          is_active !== undefined ? is_active : oldRec.is_active,
          employee_id || null, cnic || null, date_of_birth || null,
          joining_date || null, gender || null, qualification || null,
          specialization || null, address || null, userId
        ]
      );
    } else {
      await query(
        `UPDATE users SET username=?, full_name=?, role=?, email=?, phone=?, is_active=COALESCE(?, is_active), employee_id=?, cnic=?, date_of_birth=?, joining_date=?, gender=?, qualification=?, specialization=?, address=? WHERE id=?`,
        [
          username, full_name, role, email || null, phone || null,
          is_active !== undefined ? is_active : oldRec.is_active,
          employee_id || null, cnic || null, date_of_birth || null,
          joining_date || null, gender || null, qualification || null,
          specialization || null, address || null, userId
        ]
      );
    }

    // Teacher details are stored on the user row itself — no separate table to sync.

    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username or Employee ID / CNIC already taken by another account.' });
    }
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/users/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own active admin account.' });
    }
    const rows = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const record = rows[0];
    delete record.password;

    await query(
      `INSERT INTO recycle_bin (original_table, original_id, record_data, deleted_by, deleted_by_name) VALUES (?, ?, ?, ?, ?)`,
      ['users', record.id, JSON.stringify(record), req.user.id, req.user.full_name]
    );
    await query(
      `INSERT INTO edit_log (target_table, target_id, action, old_data, edited_by, edited_by_name, description) VALUES (?, ?, 'delete', ?, ?, ?, ?)`,
      ['users', record.id, JSON.stringify(record), req.user.id, req.user.full_name, `Deleted user "${record.full_name}" (${record.username})`]
    );

    // Teacher details live on the user row, so removing the user removes everything.

    await query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ success: true, message: 'User removed and archived to recycle bin' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Teachers CRUD — teacher details now live in the users table (role = 'teacher')
app.get('/api/admin/teachers', authenticate, authorize(['admin', 'principal']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT id, username, full_name, role, email, phone, employee_id, cnic, date_of_birth,
             gender, qualification, specialization, joining_date, address, photo_path,
             is_active, created_at
      FROM users
      WHERE role = 'teacher'
      ORDER BY id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/teachers', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { full_name, employee_id, cnic, phone, email, qualification, specialization, joining_date, address, password } = req.body;
    if (!full_name) return res.status(400).json({ message: 'Full name is required' });

    // Build a unique username from employee_id / CNIC / name
    let base = (employee_id || cnic || full_name).toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (!base) base = 'teacher';
    let username = base, suffix = 1;
    for (;;) {
      const [dupe] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [username]);
      if (dupe.length === 0) break;
      username = base + (++suffix);
    }

    const plainPass = (password && password.trim().length >= 6) ? password.trim() : 'teacher123';
    const hash = await bcrypt.hash(plainPass, 10);
    const result = await query(
      `INSERT INTO users (username, password, full_name, role, email, phone, employee_id, cnic, qualification, specialization, joining_date, address, is_active)
       VALUES (?, ?, ?, 'teacher', ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, 1))`,
      [username, hash, full_name.trim(), email || null, phone || null, employee_id || null, cnic || null,
       qualification || null, specialization || null, joining_date || null, address || null,
       req.body.is_active !== undefined ? req.body.is_active : 1]
    );

    res.status(201).json({ success: true, id: result.insertId, username, default_password: plainPass });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/teachers/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { full_name, employee_id, cnic, phone, qualification, specialization, joining_date, address, is_active } = req.body;

    const oldRows = await query("SELECT * FROM users WHERE id = ? AND role = 'teacher'", [req.params.id]);
    if (oldRows.length === 0) return res.status(404).json({ message: 'Teacher not found' });
    const oldRec = { ...oldRows[0] }; delete oldRec.password;

    await query(
      `INSERT INTO edit_log (target_table, target_id, action, old_data, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'update', ?, ?, ?, ?, ?)`,
      ['users', req.params.id, JSON.stringify(oldRec), JSON.stringify(req.body), req.user.id, req.user.full_name, `Updated teacher "${full_name}"`]
    );

    await query(
      `UPDATE users SET full_name=?, employee_id=?, cnic=?, phone=?, qualification=?, specialization=?, joining_date=?, address=?, is_active=COALESCE(?, is_active) WHERE id=? AND role='teacher'`,
      [full_name, employee_id || null, cnic || null, phone || null, qualification || null, specialization || null, joining_date || null, address || null, is_active, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/teachers/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const rows = await query("SELECT * FROM users WHERE id = ? AND role = 'teacher'", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Teacher not found' });
    const record = { ...rows[0] }; delete record.password;
    await query(
      `INSERT INTO recycle_bin (original_table, original_id, record_data, deleted_by, deleted_by_name) VALUES (?, ?, ?, ?, ?)`,
      ['users', record.id, JSON.stringify(record), req.user.id, req.user.full_name]
    );
    await query(
      `INSERT INTO edit_log (target_table, target_id, action, old_data, edited_by, edited_by_name, description) VALUES (?, ?, 'delete', ?, ?, ?, ?)`,
      ['users', record.id, JSON.stringify(record), req.user.id, req.user.full_name, `Deleted teacher "${record.full_name}"`]
    );
    await query("DELETE FROM users WHERE id = ? AND role = 'teacher'", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Students CRUD (Admin & Principal View)
app.get('/api/admin/students', authenticate, authorize(['admin', 'principal']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.*, c.class_name
      FROM students s
      LEFT JOIN enrollments e ON s.id = e.student_id
      LEFT JOIN classes c ON e.class_id = c.id
      ORDER BY s.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/students/:id — Single student full profile
app.get('/api/admin/students/:id', authenticate, authorize(['admin', 'principal', 'teacher']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.*, c.class_name
      FROM students s
      LEFT JOIN enrollments e ON s.id = e.student_id
      LEFT JOIN classes c ON e.class_id = c.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    const student = rows[0];

    // Fetch results
    const results = await query(`
      SELECT r.*, NULL as subject_name
      FROM results r
      WHERE r.student_id = ?
      ORDER BY r.id DESC
    `, [req.params.id]);

    // Daily attendance table removed — no per-student attendance summary
    res.json({
      ...student,
      results,
      attendance: null
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/students', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const {
      student_id, full_name, father_name, cnic, date_of_birth, gender, phone, email,
      address, district, admission_date, status, class_id,
      applied_course_id, applied_date, degree_status, completion_date, study_plan, projects
    } = req.body;

    const result = await query(
      `INSERT INTO students (
        student_id, full_name, father_name, cnic, date_of_birth, gender, phone, email,
        address, district, admission_date, status,
        applied_course_id, applied_date, degree_status, completion_date, study_plan, projects
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_id || null, full_name, father_name || null, cnic || null, date_of_birth || null,
        gender || 'male', phone || null, email || null, address || null, district || null,
        admission_date || null, status || 'active',
        applied_course_id || null, applied_date || null, degree_status || 'enrolled',
        completion_date || null, study_plan || null, projects || null
      ]
    );

    if (class_id) {
      await query(`INSERT INTO enrollments (student_id, class_id) VALUES (?, ?)`, [result.insertId, class_id]);
    }

    // Log creation in edit_log
    await query(
      `INSERT INTO edit_log (target_table, target_id, action, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'create', ?, ?, ?, ?)`,
      ['students', result.insertId, JSON.stringify(req.body), req.user.id, req.user.full_name, `Registered new student "${full_name}"`]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/students/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const {
      student_id, full_name, father_name, cnic, date_of_birth, gender, phone, email,
      address, district, admission_date, status, class_id,
      applied_course_id, applied_date, degree_status, completion_date, study_plan, projects
    } = req.body;
    
    // Fetch previous data for audit/rollback
    const oldRows = await query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (oldRows.length > 0) {
      await query(
        `INSERT INTO edit_log (target_table, target_id, action, old_data, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'update', ?, ?, ?, ?, ?)`,
        ['students', req.params.id, JSON.stringify(oldRows[0]), JSON.stringify(req.body), req.user.id, req.user.full_name, `Updated student "${full_name}"`]
      );
    }

    await query(
      `UPDATE students SET 
        student_id=?, full_name=?, father_name=?, cnic=?, date_of_birth=?, gender=?, 
        phone=?, email=?, address=?, district=?, admission_date=?, status=?,
        applied_course_id=?, applied_date=?, degree_status=?, completion_date=?, study_plan=?, projects=?
       WHERE id=?`,
      [
        student_id || null, full_name, father_name || null, cnic || null, date_of_birth || null,
        gender || 'male', phone || null, email || null, address || null, district || null,
        admission_date || null, status || 'active',
        applied_course_id || null, applied_date || null, degree_status || 'enrolled',
        completion_date || null, study_plan || null, projects || null,
        req.params.id
      ]
    );

    if (class_id) {
      await query(`
        INSERT INTO enrollments (student_id, class_id) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE class_id = VALUES(class_id)
      `, [req.params.id, class_id]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/students/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    const record = rows[0];
    await query(
      `INSERT INTO recycle_bin (original_table, original_id, record_data, deleted_by, deleted_by_name) VALUES (?, ?, ?, ?, ?)`,
      ['students', record.id, JSON.stringify(record), req.user.id, req.user.full_name]
    );
    await query(
      `INSERT INTO edit_log (target_table, target_id, action, old_data, edited_by, edited_by_name, description) VALUES (?, ?, 'delete', ?, ?, ?, ?)`,
      ['students', record.id, JSON.stringify(record), req.user.id, req.user.full_name, `Deleted student "${record.full_name}"`]
    );
    await query('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Courses module removed — /api/admin/courses CRUD deprecated

// ==================== SESSIONS & SUBJECTS ROUTES (Admin) ====================

// GET /api/admin/sessions/stats — Overview KPIs
app.get('/api/admin/sessions/stats', authenticate, authorize(['admin', 'principal', 'teacher']), async (req, res) => {
  try {
    const [[{ totalSessions }]] = await pool.query('SELECT COUNT(*) as totalSessions FROM academic_sessions');
    const [[{ completedSessions }]] = await pool.query("SELECT COUNT(*) as completedSessions FROM academic_sessions WHERE status = 'completed'");
    const [[{ activeSessions }]] = await pool.query("SELECT COUNT(*) as activeSessions FROM academic_sessions WHERE status = 'active'");
    const [[{ upcomingSessions }]] = await pool.query("SELECT COUNT(*) as upcomingSessions FROM academic_sessions WHERE status = 'upcoming'");
    // Total student admissions: either sum of session admissions or total students count
    const [[{ totalStudentsCount }]] = await pool.query('SELECT COUNT(*) as totalStudentsCount FROM students');
    const [[{ sumRecordedAdmissions }]] = await pool.query('SELECT COALESCE(SUM(total_admissions), 0) as sumRecordedAdmissions FROM academic_sessions');
    const totalAdmissions = Math.max(totalStudentsCount || 0, sumRecordedAdmissions || 0);

    // Class / Trade breakdown (DIT, CCVT, GIT, ...) from the classes table + enrollments.
    // (Courses & Subjects modules were removed — trades now come from real classes.)
    let classBreakdown = [];
    try {
      const [rows] = await pool.query(`
        SELECT c.id AS class_id, c.class_name, c.session_year,
               COUNT(e.student_id) AS enrolled_students
        FROM classes c
        LEFT JOIN enrollments e ON e.class_id = c.id
        WHERE c.is_active = 1
        GROUP BY c.id
        ORDER BY c.class_name ASC
      `);
      classBreakdown = rows.map(r => {
        const name = r.class_name || '';
        const trade_code = (name.split(/[—–\-\s]/)[0] || '').toUpperCase();
        return {
          class_id: r.class_id,
          class_name: name,
          trade_code: trade_code || 'GEN',
          session_year: r.session_year,
          enrolled_students: r.enrolled_students || 0
        };
      });
    } catch (e) { /* classes table unavailable */ }

    const totalClasses = classBreakdown.length;
    const totalSubjects = 0; // Subjects module removed

    res.json({
      totalSessions,
      completedSessions,
      activeSessions,
      upcomingSessions,
      totalSubjects,
      totalClasses,
      totalAdmissions,
      totalStudentsCount,
      classBreakdown
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/sessions — List all sessions with computed student & course counts
app.get('/api/admin/sessions', authenticate, authorize(['admin', 'principal', 'teacher']), async (req, res) => {
  try {
    const sessions = await query('SELECT * FROM academic_sessions ORDER BY start_date DESC, id DESC');
    
    const enriched = await Promise.all(sessions.map(async (sess) => {
      // Direct students linked by session_id
      const [[{ directStudents }]] = await pool.query(
        'SELECT COUNT(*) as directStudents FROM students WHERE session_id = ?',
        [sess.id]
      );

      // Course-wise counts removed (Courses module deprecated)
      const courseCounts = [];

      // Total subjects in system
      const sessionSubjects = 0; // Subjects module removed

      const enrolledCount = Math.max(sess.total_admissions || 0, directStudents || 0);

      return {
        ...sess,
        enrolled_students: enrolledCount,
        direct_students: directStudents,
        course_counts: courseCounts,
        total_subjects: sessionSubjects
      };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/sessions — Add new academic session
app.post('/api/admin/sessions', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { session_name, session_code, start_date, end_date, status, total_admissions, description } = req.body;
    if (!session_name) {
      return res.status(400).json({ message: 'Session name is required' });
    }

    const result = await query(
      `INSERT INTO academic_sessions (session_name, session_code, start_date, end_date, status, total_admissions, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        session_name,
        session_code || null,
        start_date || null,
        end_date || null,
        status || 'active',
        total_admissions || 0,
        description || null
      ]
    );

    await query(
      `INSERT INTO edit_log (target_table, target_id, action, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'create', ?, ?, ?, ?)`,
      ['academic_sessions', result.insertId, JSON.stringify(req.body), req.user.id, req.user.full_name, `Created academic session "${session_name}"`]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/sessions/:id — Edit academic session
app.put('/api/admin/sessions/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { session_name, session_code, start_date, end_date, status, total_admissions, description } = req.body;
    const oldRows = await query('SELECT * FROM academic_sessions WHERE id = ?', [req.params.id]);
    if (oldRows.length === 0) return res.status(404).json({ message: 'Session not found' });

    await query(
      `INSERT INTO edit_log (target_table, target_id, action, old_data, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'update', ?, ?, ?, ?, ?)`,
      ['academic_sessions', req.params.id, JSON.stringify(oldRows[0]), JSON.stringify(req.body), req.user.id, req.user.full_name, `Updated session "${session_name || oldRows[0].session_name}"`]
    );

    await query(
      `UPDATE academic_sessions SET session_name=?, session_code=?, start_date=?, end_date=?, status=?, total_admissions=?, description=? WHERE id=?`,
      [
        session_name || oldRows[0].session_name,
        session_code || null,
        start_date || null,
        end_date || null,
        status || 'active',
        total_admissions !== undefined ? total_admissions : oldRows[0].total_admissions,
        description || null,
        req.params.id
      ]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/sessions/:id/toggle-status — Toggle completed / active
app.post('/api/admin/sessions/:id/toggle-status', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM academic_sessions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Session not found' });
    const sess = rows[0];
    const newStatus = sess.status === 'completed' ? 'active' : 'completed';

    await query('UPDATE academic_sessions SET status = ? WHERE id = ?', [newStatus, req.params.id]);

    await query(
      `INSERT INTO edit_log (target_table, target_id, action, old_data, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'update', ?, ?, ?, ?, ?)`,
      ['academic_sessions', req.params.id, JSON.stringify({ status: sess.status }), JSON.stringify({ status: newStatus }), req.user.id, req.user.full_name, `Changed session "${sess.session_name}" status to ${newStatus}`]
    );

    res.json({ success: true, status: newStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/sessions/:id — Move session to recycle bin
app.delete('/api/admin/sessions/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM academic_sessions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Session not found' });
    const record = rows[0];

    await query(
      `INSERT INTO recycle_bin (original_table, original_id, record_data, deleted_by, deleted_by_name) VALUES (?, ?, ?, ?, ?)`,
      ['academic_sessions', record.id, JSON.stringify(record), req.user.id, req.user.full_name]
    );

    await query(
      `INSERT INTO edit_log (target_table, target_id, action, old_data, edited_by, edited_by_name, description) VALUES (?, ?, 'delete', ?, ?, ?, ?)`,
      ['academic_sessions', record.id, JSON.stringify(record), req.user.id, req.user.full_name, `Deleted session "${record.session_name}"`]
    );

    await query('DELETE FROM academic_sessions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/sessions/:id/students — List students for a specific session
app.get('/api/admin/sessions/:id/students', authenticate, authorize(['admin', 'principal', 'teacher']), async (req, res) => {
  try {
    let sql = `
      SELECT s.*
      FROM students s
      WHERE s.session_id = ?
    `;
    const params = [req.params.id];
    sql += ' ORDER BY s.id DESC';

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/sessions/quick-enroll — Quick student registration in a session & course
app.post('/api/admin/sessions/quick-enroll', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { full_name, father_name, cnic, phone, session_id, admission_date, class_id } = req.body;
    if (!full_name || !session_id) {
      return res.status(400).json({ message: 'Student name and session are required.' });
    }

    const autoStudentId = 'STU-' + Date.now().toString().slice(-6);

    const result = await query(
      `INSERT INTO students (student_id, full_name, father_name, cnic, phone, session_id, admission_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        autoStudentId,
        full_name,
        father_name || null,
        cnic || null,
        phone || null,
        session_id,
        admission_date || new Date().toISOString().split('T')[0]
      ]
    );

    // Enroll the student into the selected class/trade (DIT, CCVT, GIT, ...) so trade counts update
    if (class_id) {
      try {
        await query(
          'INSERT INTO enrollments (student_id, class_id, roll_number) VALUES (?, ?, ?)',
          [result.insertId, class_id, autoStudentId]
        );
      } catch (e) { /* ignore duplicate / missing class */ }
    }

    // Update session admissions count if present
    await query('UPDATE academic_sessions SET total_admissions = total_admissions + 1 WHERE id = ?', [session_id]);

    await query(
      `INSERT INTO edit_log (target_table, target_id, action, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'create', ?, ?, ?, ?)`,
      ['students', result.insertId, JSON.stringify(req.body), req.user.id, req.user.full_name, `Quick enrolled student "${full_name}" into session #${session_id}`]
    );

    res.status(201).json({ success: true, id: result.insertId, student_id: autoStudentId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Subjects module removed — /api/admin/subjects CRUD deprecated

// ==================== RECYCLE BIN ROUTES (Admin Only) ====================

// GET /api/admin/recycle-bin — list all deleted records
app.get('/api/admin/recycle-bin', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM recycle_bin ORDER BY deleted_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/recycle-bin/:id/restore — restore a deleted record
app.post('/api/admin/recycle-bin/:id/restore', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM recycle_bin WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Record not found in recycle bin' });
    const bin = rows[0];
    const data = typeof bin.record_data === 'string' ? JSON.parse(bin.record_data) : bin.record_data;
    const table = bin.original_table;

    // Build INSERT from the saved data (exclude id — let DB auto-increment)
    const cols = Object.keys(data).filter(k => k !== 'id');
    const vals = cols.map(k => data[k]);
    const placeholders = cols.map(() => '?').join(', ');
    await query(`INSERT INTO \`${table}\` (${cols.map(c => '`'+c+'`').join(', ')}) VALUES (${placeholders})`, vals);

    // Log the restore action
    await query(
      `INSERT INTO edit_log (target_table, target_id, action, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'restore', ?, ?, ?, ?)`,
      [table, bin.original_id, JSON.stringify(data), req.user.id, req.user.full_name, `Restored ${table} record "${data.full_name || data.course_name || data.username || 'ID:'+bin.original_id}"`]
    );

    // Remove from recycle bin
    await query('DELETE FROM recycle_bin WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Record restored successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Restore failed: ' + err.message });
  }
});

// DELETE /api/admin/recycle-bin/:id — permanently delete from recycle bin
app.delete('/api/admin/recycle-bin/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await query('DELETE FROM recycle_bin WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/recycle-bin — empty entire recycle bin
app.delete('/api/admin/recycle-bin', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await query('DELETE FROM recycle_bin');
    res.json({ success: true, message: 'Recycle bin emptied' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== EDIT LOG ROUTES (Admin Only) ====================

// GET /api/admin/edit-log — list all edits
app.get('/api/admin/edit-log', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM edit_log ORDER BY created_at DESC LIMIT 500');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/edit-log/:id/restore — restore data from an edit log entry (rollback)
app.post('/api/admin/edit-log/:id/restore', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM edit_log WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Edit log entry not found' });
    const entry = rows[0];
    
    if (!entry.old_data) {
      return res.status(400).json({ message: 'No previous data available to restore from this log entry' });
    }

    const oldData = typeof entry.old_data === 'string' ? JSON.parse(entry.old_data) : entry.old_data;
    const table = entry.target_table;
    const targetId = entry.target_id;

    // Check if the record still exists
    const existing = await query(`SELECT id FROM \`${table}\` WHERE id = ?`, [targetId]);
    
    if (existing.length > 0) {
      // Update existing record back to old data
      const cols = Object.keys(oldData).filter(k => k !== 'id');
      const setClause = cols.map(c => '`'+c+'` = ?').join(', ');
      const vals = cols.map(k => oldData[k]);
      vals.push(targetId);
      await query(`UPDATE \`${table}\` SET ${setClause} WHERE id = ?`, vals);
    } else {
      // Re-insert the record
      const cols = Object.keys(oldData).filter(k => k !== 'id');
      const vals = cols.map(k => oldData[k]);
      const placeholders = cols.map(() => '?').join(', ');
      await query(`INSERT INTO \`${table}\` (${cols.map(c => '`'+c+'`').join(', ')}) VALUES (${placeholders})`, vals);
    }

    // Log this restore action
    await query(
      `INSERT INTO edit_log (target_table, target_id, action, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'restore', ?, ?, ?, ?)`,
      [table, targetId, JSON.stringify(oldData), req.user.id, req.user.full_name, `Restored ${table} #${targetId} from edit log`]
    );

    res.json({ success: true, message: 'Data restored from edit log' });
  } catch (err) {
    res.status(500).json({ message: 'Restore failed: ' + err.message });
  }
});

// DELETE /api/admin/edit-log — clear all edit logs
app.delete('/api/admin/edit-log', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await query('DELETE FROM edit_log');
    res.json({ success: true, message: 'Edit log cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== ACCOUNTING ROUTES ====================

// GET /api/accounting/summary
app.get('/api/accounting/summary', authenticate, authorize(['admin', 'accounting', 'principal']), async (req, res) => {
  try {
    const [[totals]] = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
        COUNT(*) AS total_transactions
      FROM accounting_transactions
    `);

    const net_balance = parseFloat(totals.total_income) - parseFloat(totals.total_expense);

    // Grouped by categories
    const categoryBreakdown = await query(`
      SELECT category, type, SUM(amount) as total_amount, COUNT(*) as count
      FROM accounting_transactions
      GROUP BY category, type
    `);

    // Recent 10 transactions
    const recent = await query(`
      SELECT * FROM accounting_transactions
      ORDER BY receipt_date DESC, id DESC
      LIMIT 10
    `);

    res.json({
      total_income: parseFloat(totals.total_income),
      total_expense: parseFloat(totals.total_expense),
      net_balance: net_balance,
      total_transactions: totals.total_transactions,
      categoryBreakdown,
      recent
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/accounting/transactions
app.get('/api/accounting/transactions', authenticate, authorize(['admin', 'accounting', 'principal']), async (req, res) => {
  try {
    const { category, type, search, start_date, end_date } = req.query;
    let sql = 'SELECT * FROM accounting_transactions WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (start_date) {
      sql += ' AND receipt_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND receipt_date <= ?';
      params.push(end_date);
    }
    if (search) {
      sql += ' AND (title LIKE ? OR paid_to_or_from LIKE ? OR receipt_number LIKE ? OR description LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY receipt_date DESC, id DESC';
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/accounting/transactions
app.post('/api/accounting/transactions', authenticate, authorize(['admin', 'accounting']), async (req, res) => {
  try {
    const {
      title, category, type, amount, payment_method, receipt_number,
      receipt_image, receipt_date, paid_to_or_from, description
    } = req.body;

    if (!title || !category || !type || !amount || !receipt_date) {
      return res.status(400).json({ message: 'Title, category, type, amount, and date are required.' });
    }

    const result = await query(
      `INSERT INTO accounting_transactions (
        title, category, type, amount, payment_method, receipt_number,
        receipt_image, receipt_date, paid_to_or_from, description,
        recorded_by, recorded_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, category, type, amount, payment_method || 'Cash', receipt_number || null,
        receipt_image || null, receipt_date, paid_to_or_from || null, description || null,
        req.user.id, req.user.full_name
      ]
    );

    // Audit log
    await query(
      `INSERT INTO edit_log (target_table, target_id, action, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'create', ?, ?, ?, ?)`,
      ['accounting_transactions', result.insertId, JSON.stringify(req.body), req.user.id, req.user.full_name, `Recorded ${type} transaction: "${title}" (PKR ${amount})`]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/accounting/transactions/:id
app.put('/api/accounting/transactions/:id', authenticate, authorize(['admin', 'accounting']), async (req, res) => {
  try {
    const {
      title, category, type, amount, payment_method, receipt_number,
      receipt_image, receipt_date, paid_to_or_from, description
    } = req.body;

    const oldRows = await query('SELECT * FROM accounting_transactions WHERE id = ?', [req.params.id]);
    if (oldRows.length === 0) return res.status(404).json({ message: 'Transaction not found' });

    await query(
      `INSERT INTO edit_log (target_table, target_id, action, old_data, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'update', ?, ?, ?, ?, ?)`,
      ['accounting_transactions', req.params.id, JSON.stringify(oldRows[0]), JSON.stringify(req.body), req.user.id, req.user.full_name, `Updated transaction "${title || oldRows[0].title}"`]
    );

    await query(
      `UPDATE accounting_transactions SET
        title=?, category=?, type=?, amount=?, payment_method=?, receipt_number=?,
        receipt_image=COALESCE(?, receipt_image), receipt_date=?, paid_to_or_from=?, description=?
       WHERE id=?`,
      [
        title, category, type, amount, payment_method, receipt_number,
        receipt_image || null, receipt_date, paid_to_or_from, description,
        req.params.id
      ]
    );

    res.json({ success: true, message: 'Transaction updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/accounting/transactions/:id
app.delete('/api/accounting/transactions/:id', authenticate, authorize(['admin', 'accounting']), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM accounting_transactions WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Transaction not found' });
    const record = rows[0];

    await query(
      `INSERT INTO recycle_bin (original_table, original_id, record_data, deleted_by, deleted_by_name) VALUES (?, ?, ?, ?, ?)`,
      ['accounting_transactions', record.id, JSON.stringify(record), req.user.id, req.user.full_name]
    );

    await query(
      `INSERT INTO edit_log (target_table, target_id, action, old_data, edited_by, edited_by_name, description) VALUES (?, ?, 'delete', ?, ?, ?, ?)`,
      ['accounting_transactions', record.id, JSON.stringify(record), req.user.id, req.user.full_name, `Deleted transaction "${record.title}" (PKR ${record.amount})`]
    );

    await query('DELETE FROM accounting_transactions WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Transaction moved to recycle bin' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== ADMIN CONTROL & SETTINGS ROUTES ====================

// GET /api/admin/control/stats — comprehensive system overview
app.get('/api/admin/control/stats', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const [[{ usersCount }]] = await pool.query('SELECT COUNT(*) as usersCount FROM users');
    const [[{ teachersCount }]] = await pool.query("SELECT COUNT(*) as teachersCount FROM users WHERE role = 'teacher'");
    const [[{ studentsCount }]] = await pool.query('SELECT COUNT(*) as studentsCount FROM students');
    const coursesCount = 0; // Courses module removed
    const [[{ resultsCount }]] = await pool.query('SELECT COUNT(*) as resultsCount FROM results');
    const [[{ recycleCount }]] = await pool.query('SELECT COUNT(*) as recycleCount FROM recycle_bin');
    const [[{ editCount }]] = await pool.query('SELECT COUNT(*) as editCount FROM edit_log');
    const [[{ sessionsCount }]] = await pool.query('SELECT COUNT(*) as sessionsCount FROM academic_sessions');
    const subjectsCount = 0; // Subjects module removed
    
    // Accounting stats
    const [[acc]] = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS totalIncome,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS totalExpense
      FROM accounting_transactions
    `);

    res.json({
      counts: {
        users: usersCount,
        teachers: teachersCount,
        students: studentsCount,
        courses: coursesCount,
        results: resultsCount,
        recycleBin: recycleCount,
        editLog: editCount,
        sessions: sessionsCount,
        subjects: subjectsCount
      },
      finance: {
        totalIncome: parseFloat(acc.totalIncome),
        totalExpense: parseFloat(acc.totalExpense),
        balance: parseFloat(acc.totalIncome) - parseFloat(acc.totalExpense)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== DATABASE STORAGE & PARTITION MANAGER ====================

const STORAGE_CONFIG_PATH = path.join(__dirname, 'database_storage_config.json');

function getStorageConfig() {
  const defaultPath = path.join(__dirname, 'database');
  const defaults = {
    primaryLocation: defaultPath,
    locations: [
      {
        id: 1,
        name: 'Default Project Database Folder',
        path: defaultPath,
        partition: 'C:',
        isPrimary: true,
        autoBackup: true,
        lastBackupAt: null,
        createdAt: new Date().toISOString()
      }
    ]
  };

  try {
    if (!fs.existsSync(STORAGE_CONFIG_PATH)) {
      fs.writeFileSync(STORAGE_CONFIG_PATH, JSON.stringify(defaults, null, 2), 'utf8');
      return defaults;
    }
    const data = fs.readFileSync(STORAGE_CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed.locations || !Array.isArray(parsed.locations) || parsed.locations.length === 0) {
      return defaults;
    }
    return parsed;
  } catch (e) {
    return defaults;
  }
}

function saveStorageConfig(config) {
  fs.writeFileSync(STORAGE_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

function getDirectorySize(dirPath) {
  let totalBytes = 0;
  if (!fs.existsSync(dirPath)) return 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          totalBytes += getDirectorySize(fullPath);
        } else {
          totalBytes += stat.size;
        }
      } catch (e) {}
    }
  } catch (e) {}
  return totalBytes;
}

function getSystemDrives() {
  return new Promise((resolve) => {
    const psCmd = `Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID, VolumeName, Size, FreeSpace, DriveType | ConvertTo-Json -Compress`;
    cp.exec(`powershell -NoProfile -Command "${psCmd}"`, { timeout: 5000 }, (err, stdout) => {
      const fallbackLetters = ['C', 'D', 'E', 'F', 'G', 'L', 'P'];
      if (err || !stdout || !stdout.trim()) {
        const drives = [];
        for (const l of fallbackLetters) {
          const root = `${l}:\\`;
          if (fs.existsSync(root)) {
            drives.push({
              driveLetter: `${l}:`,
              name: `Local Disk (${l}:)`,
              totalBytes: 0,
              freeBytes: 0,
              usedBytes: 0,
              totalGB: 'N/A',
              freeGB: 'N/A',
              usedGB: 'N/A',
              usedPercent: 0
            });
          }
        }
        return resolve(drives);
      }
      try {
        let parsed = JSON.parse(stdout);
        if (!Array.isArray(parsed)) parsed = [parsed];
        const drives = parsed
          .filter(d => d.DriveType === 3 || d.DriveType === 2)
          .map(d => {
            const size = Number(d.Size || 0);
            const free = Number(d.FreeSpace || 0);
            const used = size > free ? size - free : 0;
            const pct = size > 0 ? Math.round((used / size) * 100) : 0;
            return {
              driveLetter: d.DeviceID,
              name: d.VolumeName ? `${d.VolumeName} (${d.DeviceID})` : `Local Disk (${d.DeviceID})`,
              totalBytes: size,
              freeBytes: free,
              usedBytes: used,
              totalGB: (size / (1024 ** 3)).toFixed(1),
              freeGB: (free / (1024 ** 3)).toFixed(1),
              usedGB: (used / (1024 ** 3)).toFixed(1),
              usedPercent: pct
            };
          });
        resolve(drives);
      } catch (pe) {
        resolve([]);
      }
    });
  });
}

async function dumpDatabaseSQL() {
  const [tables] = await pool.query('SHOW FULL TABLES WHERE Table_Type = "BASE TABLE"');
  let sqlDump = `-- ============================================================\n`;
  sqlDump += `-- GTVC Dargai Database Complete Backup & Schema Export\n`;
  sqlDump += `-- Export Date: ${new Date().toISOString()}\n`;
  sqlDump += `-- Host: ${dbConfig.host} | Database: ${dbConfig.database}\n`;
  sqlDump += `-- ============================================================\n\n`;
  sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

  for (const row of tables) {
    const tableName = Object.values(row)[0];
    const [[createRow]] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
    sqlDump += `-- ------------------------------------------------------------\n`;
    sqlDump += `-- Structure for table \`${tableName}\`\n`;
    sqlDump += `-- ------------------------------------------------------------\n`;
    sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    sqlDump += `${createRow['Create Table']};\n\n`;

    const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
    if (rows.length > 0) {
      sqlDump += `-- Dumping data for table \`${tableName}\` (${rows.length} records)\n`;
      const cols = Object.keys(rows[0]);
      const colList = cols.map(c => `\`${c}\``).join(', ');

      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const valStrings = batch.map(r => {
          const vals = cols.map(c => {
            const val = r[c];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return val;
            if (typeof val === 'boolean') return val ? 1 : 0;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "\\'")}'`;
            return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
          });
          return `(${vals.join(', ')})`;
        });
        sqlDump += `INSERT INTO \`${tableName}\` (${colList}) VALUES\n${valStrings.join(',\n')};\n\n`;
      }
    }
  }

  sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  return sqlDump;
}

// GET /api/admin/database/storage — Storage metrics, locations, and drives
app.get('/api/admin/database/storage', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const drives = await getSystemDrives();
    const config = getStorageConfig();

    // MySQL Table storage stats
    const [tables] = await pool.query(`
      SELECT 
        table_name,
        ROUND(((data_length + index_length) / 1024), 2) AS size_kb,
        ROUND(((data_length + index_length) / (1024 * 1024)), 3) AS size_mb,
        table_rows
      FROM information_schema.TABLES 
      WHERE table_schema = ?
      ORDER BY (data_length + index_length) DESC
    `, [dbConfig.database]);

    const [[dbSizeSummary]] = await pool.query(`
      SELECT 
        ROUND(COALESCE(SUM(data_length + index_length), 0) / 1024, 2) AS total_kb,
        ROUND(COALESCE(SUM(data_length + index_length), 0) / (1024 * 1024), 3) AS total_mb
      FROM information_schema.TABLES 
      WHERE table_schema = ?
    `, [dbConfig.database]);

    // Uploads folder size
    const uploadsPath = path.join(__dirname, 'uploads');
    const uploadsBytes = getDirectorySize(uploadsPath);
    const uploadsMB = (uploadsBytes / (1024 * 1024)).toFixed(2);

    // Enrich configured locations with size, status, and drive info
    const enrichedLocations = config.locations.map(loc => {
      const exists = fs.existsSync(loc.path);
      const folderBytes = exists ? getDirectorySize(loc.path) : 0;
      const folderMB = (folderBytes / (1024 * 1024)).toFixed(2);
      
      // Count backup files
      let backupCount = 0;
      let lastFileDate = null;
      if (exists) {
        try {
          const files = fs.readdirSync(loc.path).filter(f => f.endsWith('.sql'));
          backupCount = files.length;
          if (files.length > 0) {
            const mtimes = files.map(f => fs.statSync(path.join(loc.path, f)).mtime);
            lastFileDate = new Date(Math.max(...mtimes)).toISOString();
          }
        } catch (e) {}
      }

      // Match drive
      const driveMatch = drives.find(d => loc.path.toUpperCase().startsWith(d.driveLetter.toUpperCase()));

      return {
        ...loc,
        exists,
        folderSizeBytes: folderBytes,
        folderSizeMB: parseFloat(folderMB),
        backupCount,
        lastBackupAt: lastFileDate || loc.lastBackupAt,
        driveInfo: driveMatch || null
      };
    });

    const mysqlMB = parseFloat(dbSizeSummary.total_mb || 0);
    const totalCombinedMB = (mysqlMB + parseFloat(uploadsMB)).toFixed(2);

    res.json({
      drives,
      primaryLocation: config.primaryLocation,
      locations: enrichedLocations,
      dbStats: {
        databaseName: dbConfig.database,
        mysqlTotalKB: parseFloat(dbSizeSummary.total_kb || 0),
        mysqlTotalMB: mysqlMB,
        uploadsTotalMB: parseFloat(uploadsMB),
        totalCombinedMB: parseFloat(totalCombinedMB),
        tablesCount: tables.length,
        tables
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/database/storage/locations — Add storage location
app.post('/api/admin/database/storage/locations', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { name, path: locationPath, partition, isPrimary, autoBackup } = req.body;
    if (!locationPath || !locationPath.trim()) {
      return res.status(400).json({ message: 'Folder path is required.' });
    }

    // Clean and normalize path (strip quotes, normalize slashes)
    let trimmedPath = locationPath.trim().replace(/^["']|["']$/g, '').trim();
    trimmedPath = path.normalize(trimmedPath);

    // Create target directory if possible
    let exists = fs.existsSync(trimmedPath);
    if (!exists) {
      try {
        fs.mkdirSync(trimmedPath, { recursive: true });
        exists = true;
      } catch (me) {
        console.warn(`Could not create folder at "${trimmedPath}": ${me.message}`);
        // If it's a valid drive letter path, allow saving even if drive is temporarily offline/unplugged
        const isDriveFormat = /^[A-Za-z]:[\\/]/.test(trimmedPath);
        if (!isDriveFormat) {
          return res.status(400).json({ message: `Cannot create folder at "${trimmedPath}": ${me.message}` });
        }
      }
    }

    // Detect partition letter
    const match = trimmedPath.match(/^([A-Za-z]:)/);
    const driveLetter = match ? match[1].toUpperCase() : (partition || 'C:');

    const config = getStorageConfig();

    if (isPrimary) {
      config.locations.forEach(loc => loc.isPrimary = false);
      config.primaryLocation = trimmedPath;
    }

    // Generate safe integer ID
    const existingIds = config.locations
      .map(l => Number(l.id))
      .filter(id => !isNaN(id) && id > 0 && id < 1000000000);
    const safeId = existingIds.length ? Math.max(...existingIds) + 1 : 1;

    const newLoc = {
      id: safeId,
      name: name || `Storage (${driveLetter})`,
      path: trimmedPath,
      partition: driveLetter,
      isPrimary: Boolean(isPrimary),
      autoBackup: autoBackup !== undefined ? Boolean(autoBackup) : true,
      lastBackupAt: null,
      createdAt: new Date().toISOString()
    };

    config.locations.push(newLoc);
    saveStorageConfig(config);

    try {
      await query(
        `INSERT INTO edit_log (target_table, target_id, action, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'create', ?, ?, ?, ?)`,
        ['storage_locations', safeId, JSON.stringify(newLoc), req.user ? req.user.id : null, req.user ? req.user.full_name : 'Admin', `Added database storage folder location "${trimmedPath}" on drive ${driveLetter}`]
      );
    } catch (logErr) {
      console.warn('edit_log insert skipped:', logErr.message);
    }

    res.status(201).json({ success: true, location: newLoc, exists });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/database/storage/locations/:id — Update location
app.put('/api/admin/database/storage/locations/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, path: newPath, isPrimary, autoBackup } = req.body;
    const config = getStorageConfig();
    const loc = config.locations.find(l => l.id === id);
    if (!loc) return res.status(404).json({ message: 'Storage location not found.' });

    if (newPath && newPath.trim() !== loc.path) {
      let tp = newPath.trim().replace(/^["']|["']$/g, '').trim();
      tp = path.normalize(tp);
      if (!fs.existsSync(tp)) {
        try { fs.mkdirSync(tp, { recursive: true }); } catch (me) { /* ignore */ }
      }
      loc.path = tp;
      const m = tp.match(/^([A-Za-z]:)/);
      if (m) loc.partition = m[1].toUpperCase();
    }

    if (name) loc.name = name;
    if (autoBackup !== undefined) loc.autoBackup = Boolean(autoBackup);

    if (isPrimary) {
      config.locations.forEach(l => l.isPrimary = (l.id === id));
      config.primaryLocation = loc.path;
    }

    saveStorageConfig(config);

    try {
      await query(
        `INSERT INTO edit_log (target_table, target_id, action, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'update', ?, ?, ?, ?)`,
        ['storage_locations', id, JSON.stringify(loc), req.user ? req.user.id : null, req.user ? req.user.full_name : 'Admin', `Updated database storage location "${loc.name}" (${loc.path})`]
      );
    } catch (logErr) {
      console.warn('edit_log insert skipped:', logErr.message);
    }

    res.json({ success: true, location: loc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/database/storage/locations/:id — Remove storage location
app.delete('/api/admin/database/storage/locations/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const config = getStorageConfig();
    const idx = config.locations.findIndex(l => l.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Storage location not found.' });

    if (config.locations[idx].isPrimary && config.locations.length > 1) {
      return res.status(400).json({ message: 'Cannot delete the primary database location. Set another location as primary first.' });
    }

    const removed = config.locations.splice(idx, 1)[0];
    if (config.locations.length === 0) {
      config.locations.push({
        id: 1,
        name: 'Default Database Directory',
        path: path.join(__dirname, 'database'),
        partition: 'C:',
        isPrimary: true,
        autoBackup: true,
        lastBackupAt: null,
        createdAt: new Date().toISOString()
      });
      config.primaryLocation = config.locations[0].path;
    }

    saveStorageConfig(config);

    try {
      await query(
        `INSERT INTO edit_log (target_table, target_id, action, old_data, edited_by, edited_by_name, description) VALUES (?, ?, 'delete', ?, ?, ?, ?)`,
        ['storage_locations', id, JSON.stringify(removed), req.user ? req.user.id : null, req.user ? req.user.full_name : 'Admin', `Removed database storage location "${removed.name}" (${removed.path})`]
      );
    } catch (logErr) {
      console.warn('edit_log insert skipped:', logErr.message);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/database/storage/backup-now — Perform full backup to all locations
app.post('/api/admin/database/storage/backup-now', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const config = getStorageConfig();
    const sqlDump = await dumpDatabaseSQL();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `gtvc_db_backup_${timestamp}.sql`;
    const latestFileName = 'gtvc_db_latest.sql';
    const metadataFileName = 'backup_metadata.json';

    const results = [];
    const nowIso = new Date().toISOString();

    for (const loc of config.locations) {
      try {
        if (!fs.existsSync(loc.path)) {
          fs.mkdirSync(loc.path, { recursive: true });
        }

        const fullBackupPath = path.join(loc.path, backupFileName);
        const fullLatestPath = path.join(loc.path, latestFileName);
        const metaPath = path.join(loc.path, metadataFileName);

        fs.writeFileSync(fullBackupPath, sqlDump, 'utf8');
        fs.writeFileSync(fullLatestPath, sqlDump, 'utf8');

        const meta = {
          database: dbConfig.database,
          timestamp: nowIso,
          backupFileName,
          fileSizeBytes: Buffer.byteLength(sqlDump, 'utf8'),
          fileSizeMB: (Buffer.byteLength(sqlDump, 'utf8') / (1024 * 1024)).toFixed(3),
          locationName: loc.name,
          partition: loc.partition,
          backedUpBy: req.user.full_name
        };
        fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');

        loc.lastBackupAt = nowIso;

        results.push({
          locationId: loc.id,
          locationName: loc.name,
          path: loc.path,
          partition: loc.partition,
          success: true,
          fileSizeMB: meta.fileSizeMB,
          fileName: backupFileName
        });
      } catch (locErr) {
        results.push({
          locationId: loc.id,
          locationName: loc.name,
          path: loc.path,
          partition: loc.partition,
          success: false,
          error: locErr.message
        });
      }
    }

    saveStorageConfig(config);

    const successCount = results.filter(r => r.success).length;

    await query(
      `INSERT INTO edit_log (target_table, target_id, action, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'create', ?, ?, ?, ?)`,
      ['database_backups', Date.now(), JSON.stringify(results), req.user.id, req.user.full_name, `Exported full database backup to ${successCount} storage locations (${backupFileName})`]
    );

    res.json({
      success: true,
      message: `Database backup completed successfully to ${successCount} location(s).`,
      results
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/database/storage/test-path — Check path availability & permissions
app.post('/api/admin/database/storage/test-path', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { path: checkPath } = req.body;
    if (!checkPath) return res.status(400).json({ message: 'Path is required' });

    const trimmed = checkPath.trim();
    const match = trimmed.match(/^([A-Za-z]:)/);
    const drive = match ? match[1].toUpperCase() : null;

    let exists = fs.existsSync(trimmed);
    let writable = false;

    if (!exists) {
      try {
        fs.mkdirSync(trimmed, { recursive: true });
        exists = true;
      } catch (e) {
        return res.json({ exists: false, writable: false, drive, error: e.message });
      }
    }

    try {
      const testFile = path.join(trimmed, `.test_write_${Date.now()}`);
      fs.writeFileSync(testFile, 'test', 'utf8');
      fs.unlinkSync(testFile);
      writable = true;
    } catch (we) {
      writable = false;
    }

    res.json({ success: true, exists, writable, drive, path: trimmed });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/database/storage/browse-folder — Open native Windows Folder Picker Dialog
app.post('/api/admin/database/storage/browse-folder', authenticate, authorize(['admin']), (req, res) => {
  const psScript = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = 'Select Database Storage / Backup Folder for GTVC Dargai'; $f.ShowNewFolderButton = $true; if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Write-Output $f.SelectedPath } else { Write-Output '__CANCELLED__' }`;
  cp.exec(`powershell -NoProfile -STA -Command "${psScript}"`, { timeout: 120000 }, (err, stdout) => {
    if (err) {
      return res.json({ success: false, message: 'Could not open native folder picker: ' + err.message });
    }
    const selected = (stdout || '').trim();
    if (!selected || selected === '__CANCELLED__') {
      return res.json({ success: false, cancelled: true, message: 'Folder selection was cancelled' });
    }
    const match = selected.match(/^([A-Za-z]:)/);
    const drive = match ? match[1].toUpperCase() : null;
    res.json({ success: true, path: selected, drive });
  });
});

// GET /api/admin/database/storage/explore-directory — Browse folders on system for web tree picker
app.get('/api/admin/database/storage/explore-directory', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const target = req.query.path ? req.query.path.trim() : '';

    if (!target) {
      const drives = await getSystemDrives();
      return res.json({
        success: true,
        currentPath: '',
        parentPath: null,
        isRoot: true,
        items: drives.map(d => ({
          name: d.name || `Local Disk (${d.driveLetter})`,
          path: d.driveLetter.endsWith('\\') ? d.driveLetter : `${d.driveLetter}\\`,
          partition: d.driveLetter,
          freeGB: d.freeGB,
          isDrive: true
        }))
      });
    }

    if (!fs.existsSync(target)) {
      return res.status(404).json({ success: false, message: 'Folder path does not exist on disk' });
    }

    const stat = fs.statSync(target);
    if (!stat.isDirectory()) {
      return res.status(400).json({ success: false, message: 'Target is not a directory' });
    }

    let entries = [];
    try {
      entries = fs.readdirSync(target, { withFileTypes: true });
    } catch (readErr) {
      return res.status(403).json({ success: false, message: 'Access denied: ' + readErr.message });
    }

    const folders = [];
    for (const ent of entries) {
      if (ent.isDirectory()) {
        const name = ent.name;
        if (name.startsWith('$') || name === 'System Volume Information' || name === 'Recovery') {
          continue;
        }
        folders.push({
          name: name,
          path: path.join(target, name),
          isDrive: false
        });
      }
    }

    folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    const parent = path.dirname(target);
    const isDriveRoot = /^[A-Za-z]:\\?$/.test(target);

    res.json({
      success: true,
      currentPath: target,
      parentPath: isDriveRoot ? '' : parent,
      isRoot: false,
      items: folders
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// POST /api/admin/results — add single result directly
app.post('/api/admin/results', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { student_id, class_id, subject_id, exam_type, marks_obtained, total_marks, grade, exam_date } = req.body;
    if (!student_id || !class_id || !subject_id || !exam_type || marks_obtained === undefined) {
      return res.status(400).json({ message: 'Student, class, subject, exam type, and marks are required.' });
    }

    const result = await query(
      `INSERT INTO results (student_id, class_id, subject_id, exam_type, marks_obtained, total_marks, grade, entered_by, exam_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_id, class_id, subject_id, exam_type, marks_obtained, total_marks || 100, grade || null, req.user.id, exam_date || new Date().toISOString().split('T')[0]]
    );

    await query(
      `INSERT INTO edit_log (target_table, target_id, action, new_data, edited_by, edited_by_name, description) VALUES (?, ?, 'create', ?, ?, ?, ?)`,
      ['results', result.insertId, JSON.stringify(req.body), req.user.id, req.user.full_name, `Added exam result for student #${student_id}`]
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== TEACHER ROUTES ====================

// GET /api/teacher/dashboard
app.get('/api/teacher/dashboard', authenticate, authorize(['teacher', 'admin']), async (req, res) => {
  try {
    if (!isDbConnected) {
      return res.json({ myClassesCount: 0, totalStudents: 0, todayAttendanceRate: 0, recentNotices: [] });
    }

    // Find teacher record for this user
    // teacherId is now the user's own id (teachers table merged into users)
    const teacherId = req.user.id;

    let classCount = 0;
    let studentCount = 0;

    if (teacherId) {
      const [[{ count: cCount }]] = await pool.query('SELECT COUNT(*) as count FROM classes WHERE teacher_id = ? AND is_active = 1', [teacherId]);
      classCount = cCount;

      const [[{ count: sCount }]] = await pool.query(`
        SELECT COUNT(DISTINCT e.student_id) as count
        FROM enrollments e
        JOIN classes c ON e.class_id = c.id
        WHERE c.teacher_id = ?
      `, [teacherId]);
      studentCount = sCount;
    } else {
      // Fallback: show active total classes
      const [[{ count: cCount }]] = await pool.query('SELECT COUNT(*) as count FROM classes WHERE is_active = 1');
      classCount = cCount;
    }

    res.json({
      myClassesCount: classCount,
      totalStudents: studentCount,
      todayAttendanceRate: 95
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/teacher/my-classes
app.get('/api/teacher/my-classes', authenticate, authorize(['teacher', 'admin', 'principal']), async (req, res) => {
  try {
    // teacherId is now the user's own id (teachers table merged into users)
    const teacherId = req.user.id;

    let classes;
    if (teacherId && req.user.role === 'teacher') {
      classes = await query(`
        SELECT c.*, NULL as course_name 
        FROM classes c
        WHERE c.teacher_id = ? AND c.is_active = 1
      `, [teacherId]);

      // If no specific class assigned to this teacher yet, fallback to all active classes
      if (classes.length === 0) {
        classes = await query(`
          SELECT c.*, NULL as course_name 
          FROM classes c
          WHERE c.is_active = 1
        `);
      }
    } else {
      classes = await query(`
        SELECT c.*, NULL as course_name 
        FROM classes c
        WHERE c.is_active = 1
      `);
    }

    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Subjects module removed — /api/teacher/subjects deprecated

// GET /api/teacher/my-students
app.get('/api/teacher/my-students', authenticate, async (req, res) => {
  try {
    const { class_id } = req.query;
    let sql = `
      SELECT s.*, e.roll_number, c.class_name
      FROM students s
      JOIN enrollments e ON s.id = e.student_id
      JOIN classes c ON e.class_id = c.id
    `;
    let params = [];
    if (class_id) {
      sql += ' WHERE c.id = ?';
      params.push(class_id);
    }
    sql += ' ORDER BY s.full_name ASC';
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/teacher/results
app.post('/api/teacher/results', authenticate, authorize(['teacher', 'admin']), async (req, res) => {
  try {
    const { class_id, subject_id, exam_type, exam_date, records } = req.body;
    if (!class_id || !subject_id || !exam_type || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Invalid marks submission payload' });
    }

    for (const rec of records) {
      await query(`
        INSERT INTO results (student_id, class_id, subject_id, exam_type, marks_obtained, total_marks, grade, entered_by, exam_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        rec.student_id,
        class_id,
        subject_id,
        exam_type,
        rec.marks_obtained,
        rec.total_marks || 100,
        rec.grade || null,
        req.user.id,
        exam_date || new Date().toISOString().split('T')[0]
      ]);
    }

    res.json({ success: true, message: 'Results recorded successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- Monthly Attendance Reports (teacher submits class % + .xlsx) ----

// POST /api/teacher/attendance-reports  (multipart/form-data, field 'report_file')
app.post('/api/teacher/attendance-reports', authenticate, authorize(['teacher', 'admin', 'principal']), upload.single('report_file'), async (req, res) => {
  try {
    const { class_id, month, year, percentage, total_students } = req.body;
    if (!class_id || !month || !year || percentage === undefined || percentage === '' || total_students === undefined || total_students === '') {
      // clean up orphan upload if validation fails
      if (req.file) fs.unlink(path.join(__dirname, req.file.path), () => {});
      return res.status(400).json({ message: 'Class, month, year, percentage and total students are all required' });
    }

    // teacherId is now the user's own id (teachers table merged into users)
    const teacherId = req.user.id;
    const fileName = req.file ? req.file.originalname : null;
    const filePath = req.file ? 'uploads/documents/attendance/' + req.file.filename : null;

    await query(`
      INSERT INTO attendance_reports
        (class_id, teacher_id, month, year, percentage, total_students, file_name, file_path, submitted_by, submitted_by_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        percentage = VALUES(percentage),
        total_students = VALUES(total_students),
        file_name = VALUES(file_name),
        file_path = VALUES(file_path),
        teacher_id = VALUES(teacher_id),
        submitted_by = VALUES(submitted_by),
        submitted_by_name = VALUES(submitted_by_name)
    `, [class_id, teacherId, month, year, percentage, total_students, fileName, filePath, req.user.id, req.user.full_name || req.user.username || '']);

    // Resolve any matching "missing report" notification for this class + period
    const dedupe = `attendance_missing_${class_id}_${year}_${month}`;
    await query('DELETE FROM admin_notifications WHERE dedupe_key = ?', [dedupe]).catch(() => {});

    res.json({ success: true, message: 'Monthly attendance report submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/teacher/attendance-reports  (this teacher's submitted reports)
app.get('/api/teacher/attendance-reports', authenticate, async (req, res) => {
  try {
    // teacherId is now the user's own id (teachers table merged into users)
    const teacherId = req.user.id;

    let rows;
    if (req.user.role === 'teacher' && teacherId) {
      rows = await query(`
        SELECT r.*, c.class_name, NULL as course_name
        FROM attendance_reports r
        JOIN classes c ON r.class_id = c.id
        WHERE c.teacher_id = ? OR r.teacher_id = ?
        ORDER BY r.year DESC, r.month DESC, c.class_name ASC
      `, [teacherId, teacherId]);
    } else {
      rows = await query(`
        SELECT r.*, c.class_name, NULL as course_name
        FROM attendance_reports r
        JOIN classes c ON r.class_id = c.id
        ORDER BY r.year DESC, r.month DESC, c.class_name ASC
      `);
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/teacher/attendance-reports/:id
app.delete('/api/teacher/attendance-reports/:id', authenticate, authorize(['teacher', 'admin']), async (req, res) => {
  try {
    const [rep] = await query('SELECT * FROM attendance_reports WHERE id = ?', [req.params.id]);
    if (!rep.length) return res.status(404).json({ message: 'Report not found' });
    if (rep[0].file_path) fs.unlink(path.join(__dirname, rep[0].file_path), () => {});
    await query('DELETE FROM attendance_reports WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/attendance-reports  (all reports, admin only)
app.get('/api/admin/attendance-reports', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT r.*, c.class_name, NULL as course_name, tu.full_name AS teacher_name
      FROM attendance_reports r
      JOIN classes c ON r.class_id = c.id
      LEFT JOIN users tu ON r.teacher_id = tu.id
      ORDER BY r.year DESC, r.month DESC, c.class_name ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/notifications  (persistent admin alerts)
app.get('/api/admin/notifications', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM admin_notifications ORDER BY is_read ASC, created_at DESC LIMIT 100');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/notifications/read  (mark one by {id} or all if no id)
app.post('/api/admin/notifications/read', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { id } = req.body || {};
    if (id) await query('UPDATE admin_notifications SET is_read = 1 WHERE id = ?', [id]);
    else await query('UPDATE admin_notifications SET is_read = 1');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/notifications/:id  (dismiss a single notification)
app.delete('/api/admin/notifications/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await query('DELETE FROM admin_notifications WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/notifications/clear  (scope: 'read' | 'all')
app.post('/api/admin/notifications/clear', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const scope = (req.body && req.body.scope) || 'read';
    if (scope === 'all') await query('DELETE FROM admin_notifications');
    else await query('DELETE FROM admin_notifications WHERE is_read = 1');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== PRINCIPAL ROUTES ====================

// GET /api/principal/dashboard
app.get('/api/principal/dashboard', authenticate, authorize(['principal', 'admin']), async (req, res) => {
  try {
    if (!isDbConnected) {
      return res.json({ totalStudents: 0, totalTeachers: 0, totalCourses: 0, overallAttendance: '0%' });
    }
    const [[{ totalStudents }]] = await pool.query('SELECT COUNT(*) as totalStudents FROM students WHERE status = "active"');
    const [[{ totalTeachers }]] = await pool.query("SELECT COUNT(*) as totalTeachers FROM users WHERE role = 'teacher' AND is_active = 1");
    const totalCourses = 0; // Courses module removed

    res.json({
      totalStudents,
      totalTeachers,
      totalCourses,
      overallAttendance: '92%'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/principal/teachers', authenticate, authorize(['principal', 'admin']), async (req, res) => {
  try {
    const rows = await query("SELECT id, username, full_name, email, phone, employee_id, cnic, qualification, specialization, joining_date, address, is_active FROM users WHERE role = 'teacher' ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/principal/students', authenticate, authorize(['principal', 'admin']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.*, c.class_name, NULL as course_name
      FROM students s
      LEFT JOIN enrollments e ON s.id = e.student_id
      LEFT JOIN classes c ON e.class_id = c.id
      ORDER BY s.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/results & /api/principal/results
const getResultsHandler = async (req, res) => {
  try {
    const rows = await query(`
      SELECT r.*, s.full_name as student_name, NULL as subject_name, c.class_name
      FROM results r
      JOIN students s ON r.student_id = s.id
      JOIN classes c ON r.class_id = c.id
      ORDER BY r.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
app.get('/api/admin/results', authenticate, authorize(['admin', 'principal', 'teacher']), getResultsHandler);
app.get('/api/principal/results', authenticate, authorize(['principal', 'admin', 'teacher']), getResultsHandler);

app.get('/api/principal/attendance', authenticate, authorize(['principal', 'admin']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT a.*, s.full_name as student_name, c.class_name
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      JOIN classes c ON a.class_id = c.id
      ORDER BY a.date DESC, a.id DESC
      LIMIT 200
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// notices routes removed

// ==================== REPORTS ROUTES ====================

app.get('/api/reports/:type', authenticate, authorize(['admin', 'principal']), async (req, res) => {
  try {
    const type = req.params.type;
    let data = [];

    if (type === 'students') {
      data = await query('SELECT student_id, full_name, father_name, phone, district, status, admission_date FROM students ORDER BY full_name ASC');
    } else if (type === 'teachers') {
      data = await query("SELECT employee_id, full_name, qualification, specialization, phone, joining_date FROM users WHERE role = 'teacher' AND is_active = 1 ORDER BY full_name ASC");
    } else if (type === 'results') {
      data = await query(`
        SELECT s.full_name, NULL as subject_name, r.exam_type, r.marks_obtained, r.total_marks, r.grade
        FROM results r
        JOIN students s ON r.student_id = s.id
        ORDER BY r.id DESC LIMIT 100
      `);
    }

    res.json({ type, generated_at: new Date(), data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isDbConnected ? 'connected' : 'offline',
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== SCHEDULED: MISSING MONTHLY ATTENDANCE ====================
// Flags any active class that has no attendance report for the PREVIOUS month,
// creating a persistent admin notification (deduped per class + period).
async function checkMissingAttendanceReports() {
  if (!isDbConnected) return;
  try {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() - 1, 1); // previous month
    const month = target.getMonth() + 1;
    const year = target.getFullYear();
    const monthName = target.toLocaleString('en-US', { month: 'long' });

    const classes = await query('SELECT id, class_name FROM classes WHERE is_active = 1');
    let missing = 0;
    for (const cls of classes) {
      const existing = await query('SELECT id FROM attendance_reports WHERE class_id = ? AND month = ? AND year = ?', [cls.id, month, year]);
      if (existing.length === 0) {
        missing++;
        const dedupe = `attendance_missing_${cls.id}_${year}_${month}`;
        await query(
          `INSERT IGNORE INTO admin_notifications (type, dedupe_key, title, message)
           VALUES ('attendance_missing', ?, ?, ?)`,
          [dedupe, 'Monthly attendance report missing',
           `Class "${cls.class_name}" has no attendance report submitted for ${monthName} ${year}.`]
        );
      }
    }
    console.log(`[attendance-check] ${monthName} ${year}: ${classes.length} active class(es) scanned, ${missing} missing report(s).`);
  } catch (err) {
    console.error('[attendance-check] error:', err.message);
  }
}

// ==================== SERVER START ====================
const server = app.listen(PORT, async () => {
  console.log(`\n============================================================`);
  console.log(` GTVC Dargai Offline DBMS Server running on:`);
  console.log(`   Local URL: http://localhost:${PORT}`);
  console.log(`   Login:     http://localhost:${PORT}/index.html`);
  console.log(`   Signup:    http://localhost:${PORT}/index.html?tab=signup`);
  console.log(`============================================================\n`);

  await initDatabase();

  // Run the attendance-missing scan on startup and then every 24 hours
  checkMissingAttendanceReports();
  setInterval(checkMissingAttendanceReports, 24 * 60 * 60 * 1000);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n⚠️ Port ${PORT} is already in use by another running process.`);
    console.error(`   To free port ${PORT} on Windows PowerShell, run:`);
    console.error(`   Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
    console.error(`   Then run 'node server.js' again.\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
