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
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'gtvc_dargai_secret_key_2024_change_this';

// ==================== ENSURE DIRECTORIES EXIST ====================
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'students'),
  path.join(__dirname, 'uploads', 'teachers'),
  path.join(__dirname, 'uploads', 'notices')
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
    else if (file.fieldname === 'notice_file') dest = path.join(dest, 'notices');
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

    await conn.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_name VARCHAR(150) NOT NULL,
        course_code VARCHAR(50) UNIQUE,
        duration_months INT,
        description TEXT,
        is_active TINYINT DEFAULT 1
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        employee_id VARCHAR(50) UNIQUE,
        full_name VARCHAR(150) NOT NULL,
        cnic VARCHAR(20) UNIQUE,
        date_of_birth DATE,
        gender ENUM('male', 'female', 'other'),
        qualification VARCHAR(150),
        specialization VARCHAR(150),
        joining_date DATE,
        phone VARCHAR(50),
        address TEXT,
        photo_path VARCHAR(255),
        is_active TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

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

    await conn.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject_name VARCHAR(150) NOT NULL,
        course_id INT NULL,
        total_marks INT DEFAULT 100,
        pass_marks INT DEFAULT 40
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        class_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('present', 'absent', 'leave', 'late') NOT NULL,
        marked_by INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_attendance (student_id, class_id, date)
      );
    `);

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

    await conn.query(`
      CREATE TABLE IF NOT EXISTS notices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        posted_by INT NULL,
        target_role VARCHAR(50) DEFAULT 'all',
        file_path VARCHAR(255),
        is_active TINYINT DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

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

    // 5. Seed default trades/courses if empty
    const [existingCourses] = await conn.query('SELECT id FROM courses LIMIT 1');
    if (existingCourses.length === 0) {
      await conn.query(`
        INSERT INTO courses (course_name, course_code, duration_months, description) VALUES
        ('Electrician', 'ELC', 12, 'Domestic & Industrial Electrician Trade'),
        ('Plumber', 'PLM', 6, 'Plumbing and Pipefitting Trade'),
        ('Computer Operator', 'COM', 12, 'Computer Operator & Programming Assistant'),
        ('Auto Mechanic', 'AUT', 12, 'Automobile Mechanic Trade'),
        ('Welder', 'WLD', 6, 'Welding and Fabrication Trade'),
        ('Mason / Civil Works', 'MSN', 6, 'Masonry and Civil Construction Trade'),
        ('Refrigeration & AC', 'RAC', 12, 'Refrigeration and Air Conditioning Trade');
      `);
      console.log('✅ Default GTVC trade courses initialized');
    }

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

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
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

    // If role is teacher, also create teacher profile placeholder
    if (assignedRole === 'teacher') {
      try {
        await query(
          `INSERT INTO teachers (user_id, full_name, phone, is_active) VALUES (?, ?, ?, 1)`,
          [newUserId, full_name.trim(), phone ? phone.trim() : null]
        );
      } catch (e) {
        // Non-fatal, profile can be updated later
      }
    }

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
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
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
    const [[{ totalTeachers }]] = await pool.query('SELECT COUNT(*) as totalTeachers FROM teachers WHERE is_active = 1');
    const [[{ totalCourses }]] = await pool.query('SELECT COUNT(*) as totalCourses FROM courses WHERE is_active = 1');

    const today = new Date().toISOString().split('T')[0];
    const [[attData]] = await pool.query(`
      SELECT 
        COUNT(*) as totalMarked,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as totalPresent
      FROM attendance WHERE date = ?
    `, [today]);

    let todayAttendance = 0;
    if (attData && attData.totalMarked > 0) {
      todayAttendance = Math.round((attData.totalPresent / attData.totalMarked) * 100);
    }

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

// Users CRUD (Admin)
app.get('/api/admin/users', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const users = await query('SELECT id, username, full_name, role, email, phone, is_active, created_at FROM users ORDER BY id DESC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/users', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { username, password, full_name, role, email, phone } = req.body;
    if (!username || !password || !full_name || !role) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (username, password, full_name, role, email, phone) VALUES (?, ?, ?, ?, ?, ?)`,
      [username.trim(), hash, full_name.trim(), role, email || null, phone || null]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/users/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { username, full_name, role, email, phone, password, is_active } = req.body;
    const userId = req.params.id;

    if (password && password.trim().length >= 6) {
      const hash = await bcrypt.hash(password, 10);
      await query(
        `UPDATE users SET username=?, full_name=?, role=?, email=?, phone=?, password=?, is_active=COALESCE(?, is_active) WHERE id=?`,
        [username, full_name, role, email || null, phone || null, hash, is_active, userId]
      );
    } else {
      await query(
        `UPDATE users SET username=?, full_name=?, role=?, email=?, phone=?, is_active=COALESCE(?, is_active) WHERE id=?`,
        [username, full_name, role, email || null, phone || null, is_active, userId]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/users/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    if (parseInt(req.params.id, 10) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own admin account.' });
    }
    await query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Teachers CRUD (Admin & Principal View)
app.get('/api/admin/teachers', authenticate, authorize(['admin', 'principal']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT t.*, u.username, u.email as user_email
      FROM teachers t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/teachers', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { full_name, employee_id, cnic, phone, qualification, specialization, joining_date, address } = req.body;
    const result = await query(
      `INSERT INTO teachers (full_name, employee_id, cnic, phone, qualification, specialization, joining_date, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, employee_id || null, cnic || null, phone || null, qualification || null, specialization || null, joining_date || null, address || null]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/teachers/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { full_name, employee_id, cnic, phone, qualification, specialization, joining_date, address, is_active } = req.body;
    await query(
      `UPDATE teachers SET full_name=?, employee_id=?, cnic=?, phone=?, qualification=?, specialization=?, joining_date=?, address=?, is_active=COALESCE(?, is_active) WHERE id=?`,
      [full_name, employee_id || null, cnic || null, phone || null, qualification || null, specialization || null, joining_date || null, address || null, is_active, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/teachers/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await query('DELETE FROM teachers WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Students CRUD (Admin & Principal View)
app.get('/api/admin/students', authenticate, authorize(['admin', 'principal']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.*, c.class_name, co.course_name
      FROM students s
      LEFT JOIN enrollments e ON s.id = e.student_id
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN courses co ON c.course_id = co.id
      ORDER BY s.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/students', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { student_id, full_name, father_name, cnic, date_of_birth, gender, phone, address, district, admission_date, status, class_id } = req.body;
    const result = await query(
      `INSERT INTO students (student_id, full_name, father_name, cnic, date_of_birth, gender, phone, address, district, admission_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_id || null, full_name, father_name || null, cnic || null, date_of_birth || null, gender || 'male', phone || null, address || null, district || null, admission_date || null, status || 'active']
    );

    if (class_id) {
      await query(`INSERT INTO enrollments (student_id, class_id) VALUES (?, ?)`, [result.insertId, class_id]);
    }

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/students/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { student_id, full_name, father_name, cnic, date_of_birth, gender, phone, address, district, admission_date, status, class_id } = req.body;
    await query(
      `UPDATE students SET student_id=?, full_name=?, father_name=?, cnic=?, date_of_birth=?, gender=?, phone=?, address=?, district=?, admission_date=?, status=? WHERE id=?`,
      [student_id || null, full_name, father_name || null, cnic || null, date_of_birth || null, gender || 'male', phone || null, address || null, district || null, admission_date || null, status || 'active', req.params.id]
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
    await query('DELETE FROM students WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Courses CRUD (Admin)
app.get('/api/admin/courses', authenticate, authorize(['admin', 'principal', 'teacher']), async (req, res) => {
  try {
    const rows = await query('SELECT * FROM courses ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/courses', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { course_name, course_code, duration_months, description } = req.body;
    const result = await query(
      `INSERT INTO courses (course_name, course_code, duration_months, description) VALUES (?, ?, ?, ?)`,
      [course_name, course_code || null, duration_months || 6, description || null]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/courses/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const { course_name, course_code, duration_months, description, is_active } = req.body;
    await query(
      `UPDATE courses SET course_name=?, course_code=?, duration_months=?, description=?, is_active=COALESCE(?, is_active) WHERE id=?`,
      [course_name, course_code || null, duration_months || 6, description || null, is_active, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/courses/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await query('DELETE FROM courses WHERE id = ?', [req.params.id]);
    res.json({ success: true });
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
    const teacherRows = await query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    const teacherId = teacherRows.length > 0 ? teacherRows[0].id : null;

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

    const notices = await query('SELECT * FROM notices WHERE is_active = 1 AND target_role IN ("all", "teacher") ORDER BY id DESC LIMIT 5');

    res.json({
      myClassesCount: classCount,
      totalStudents: studentCount,
      todayAttendanceRate: 95,
      recentNotices: notices
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/teacher/my-classes
app.get('/api/teacher/my-classes', authenticate, authorize(['teacher', 'admin', 'principal']), async (req, res) => {
  try {
    const teacherRows = await query('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    const teacherId = teacherRows.length > 0 ? teacherRows[0].id : null;

    let classes;
    if (teacherId && req.user.role === 'teacher') {
      classes = await query(`
        SELECT c.*, co.course_name 
        FROM classes c
        LEFT JOIN courses co ON c.course_id = co.id
        WHERE c.teacher_id = ? AND c.is_active = 1
      `, [teacherId]);

      // If no specific class assigned to this teacher yet, fallback to all active classes
      if (classes.length === 0) {
        classes = await query(`
          SELECT c.*, co.course_name 
          FROM classes c
          LEFT JOIN courses co ON c.course_id = co.id
          WHERE c.is_active = 1
        `);
      }
    } else {
      classes = await query(`
        SELECT c.*, co.course_name 
        FROM classes c
        LEFT JOIN courses co ON c.course_id = co.id
        WHERE c.is_active = 1
      `);
    }

    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/teacher/subjects
app.get('/api/teacher/subjects', authenticate, async (req, res) => {
  try {
    const { class_id } = req.query;
    let sql = 'SELECT * FROM subjects';
    let params = [];

    if (class_id) {
      sql = `
        SELECT s.* FROM subjects s
        JOIN classes c ON s.course_id = c.course_id
        WHERE c.id = ?
      `;
      params = [class_id];
    }
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

// GET /api/teacher/attendance/students
app.get('/api/teacher/attendance/students', authenticate, async (req, res) => {
  try {
    const { class_id, date } = req.query;
    if (!class_id || !date) {
      return res.status(400).json({ message: 'class_id and date are required' });
    }

    const rows = await query(`
      SELECT 
        s.id as student_id,
        s.full_name,
        e.roll_number,
        COALESCE(a.status, 'present') as status
      FROM enrollments e
      JOIN students s ON e.student_id = s.id
      LEFT JOIN attendance a ON a.student_id = s.id AND a.class_id = e.class_id AND a.date = ?
      WHERE e.class_id = ?
      ORDER BY s.full_name ASC
    `, [date, class_id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/teacher/attendance
app.post('/api/teacher/attendance', authenticate, authorize(['teacher', 'admin']), async (req, res) => {
  try {
    const { class_id, date, records } = req.body;
    if (!class_id || !date || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Invalid attendance submission payload' });
    }

    for (const rec of records) {
      await query(`
        INSERT INTO attendance (student_id, class_id, date, status, marked_by)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by)
      `, [rec.student_id, class_id, date, rec.status, req.user.id]);
    }

    res.json({ success: true, message: 'Attendance recorded successfully' });
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

// ==================== PRINCIPAL ROUTES ====================

// GET /api/principal/dashboard
app.get('/api/principal/dashboard', authenticate, authorize(['principal', 'admin']), async (req, res) => {
  try {
    if (!isDbConnected) {
      return res.json({ totalStudents: 0, totalTeachers: 0, totalCourses: 0, overallAttendance: '0%' });
    }
    const [[{ totalStudents }]] = await pool.query('SELECT COUNT(*) as totalStudents FROM students WHERE status = "active"');
    const [[{ totalTeachers }]] = await pool.query('SELECT COUNT(*) as totalTeachers FROM teachers WHERE is_active = 1');
    const [[{ totalCourses }]] = await pool.query('SELECT COUNT(*) as totalCourses FROM courses WHERE is_active = 1');

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
    const rows = await query('SELECT * FROM teachers ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/principal/students', authenticate, authorize(['principal', 'admin']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT s.*, c.class_name, co.course_name
      FROM students s
      LEFT JOIN enrollments e ON s.id = e.student_id
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN courses co ON c.course_id = co.id
      ORDER BY s.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/principal/results', authenticate, authorize(['principal', 'admin', 'teacher']), async (req, res) => {
  try {
    const rows = await query(`
      SELECT r.*, s.full_name as student_name, sub.subject_name, c.class_name
      FROM results r
      JOIN students s ON r.student_id = s.id
      JOIN subjects sub ON r.subject_id = sub.id
      JOIN classes c ON r.class_id = c.id
      ORDER BY r.id DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

// ==================== NOTICES ROUTES ====================

app.get('/api/notices', authenticate, async (req, res) => {
  try {
    let sql = 'SELECT n.*, u.full_name as author FROM notices n LEFT JOIN users u ON n.posted_by = u.id WHERE n.is_active = 1';
    const params = [];

    if (req.user && req.user.role !== 'admin' && req.user.role !== 'principal') {
      sql += ' AND (n.target_role = "all" OR n.target_role = ?)';
      params.push(req.user.role);
    }
    sql += ' ORDER BY n.id DESC';

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/notices', authenticate, authorize(['admin', 'principal']), async (req, res) => {
  try {
    const { title, content, target_role } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    const result = await query(
      `INSERT INTO notices (title, content, target_role, posted_by) VALUES (?, ?, ?, ?)`,
      [title, content, target_role || 'all', req.user.id]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/notices/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    await query('DELETE FROM notices WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==================== REPORTS ROUTES ====================

app.get('/api/reports/:type', authenticate, authorize(['admin', 'principal']), async (req, res) => {
  try {
    const type = req.params.type;
    let data = [];

    if (type === 'students') {
      data = await query('SELECT student_id, full_name, father_name, phone, district, status, admission_date FROM students ORDER BY full_name ASC');
    } else if (type === 'teachers') {
      data = await query('SELECT employee_id, full_name, qualification, specialization, phone, joining_date FROM teachers WHERE is_active = 1 ORDER BY full_name ASC');
    } else if (type === 'attendance') {
      data = await query(`
        SELECT a.date, s.full_name, c.class_name, a.status 
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN classes c ON a.class_id = c.id
        ORDER BY a.date DESC LIMIT 100
      `);
    } else if (type === 'results') {
      data = await query(`
        SELECT s.full_name, sub.subject_name, r.exam_type, r.marks_obtained, r.total_marks, r.grade
        FROM results r
        JOIN students s ON r.student_id = s.id
        JOIN subjects sub ON r.subject_id = sub.id
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

// ==================== SERVER START ====================
app.listen(PORT, async () => {
  console.log(`\n============================================================`);
  console.log(`🚀 GTVC Dargai Offline DBMS Server running on:`);
  console.log(`   Local URL: http://localhost:${PORT}`);
  console.log(`   Login:     http://localhost:${PORT}/index.html`);
  console.log(`   Signup:    http://localhost:${PORT}/signup.html`);
  console.log(`============================================================\n`);

  await initDatabase();
});
