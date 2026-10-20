-- ============================================================
-- GTVC DARGAI OFFLINE DATABASE MANAGEMENT SYSTEM
-- gtvc_db.sql — Complete MySQL Database Schema & Seed Data
-- ============================================================

CREATE DATABASE IF NOT EXISTS gtvc_db;
USE gtvc_db;

-- ============================================================
-- PART 1: TABLE DEFINITIONS (SCHEMA)
-- ============================================================

-- 1. USERS TABLE (Login accounts for Admin, Principal, Teacher)
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
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
    employee_id     VARCHAR(50) UNIQUE,
    cnic            VARCHAR(20) UNIQUE,
    date_of_birth   DATE,
    gender          ENUM('male', 'female', 'other'),
    qualification   VARCHAR(150),
    specialization  VARCHAR(150),
    joining_date    DATE,
    address         TEXT,
    photo_path      VARCHAR(255),
    is_active       TINYINT DEFAULT 1,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. COURSES TABLE (Trade programs)
CREATE TABLE IF NOT EXISTS courses (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    course_name     VARCHAR(150) NOT NULL,
    course_code     VARCHAR(50) UNIQUE,
    duration_months INT,
    description     TEXT,
    is_active       TINYINT DEFAULT 1
);

-- 4. CLASSES TABLE (Batches/Sections)
CREATE TABLE IF NOT EXISTS classes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    class_name      VARCHAR(150) NOT NULL,
    course_id       INT,
    teacher_id      INT,
    session_year    VARCHAR(50),
    start_date      DATE,
    end_date        DATE,
    is_active       TINYINT DEFAULT 1,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

-- 5. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    student_id      VARCHAR(50) UNIQUE,
    full_name       VARCHAR(150) NOT NULL,
    father_name     VARCHAR(150),
    cnic            VARCHAR(20) UNIQUE,
    date_of_birth   DATE,
    gender          ENUM('male', 'female', 'other'),
    phone           VARCHAR(50),
    address         TEXT,
    district        VARCHAR(100),
    photo_path      VARCHAR(255),
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
    date        DATE NOT NULL,
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
    target_role VARCHAR(50) DEFAULT 'all',
    file_path   VARCHAR(255),
    is_active   TINYINT DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- PART 2: INITIAL SEED DATA
-- ============================================================

-- Default Admin User
-- Password: admin123 (bcrypt hash)
INSERT IGNORE INTO users (username, password, full_name, role, phone)
VALUES (
    'admin',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'System Administrator',
    'admin',
    '0300-0000000'
);

-- Sample Courses (GTVC Dargai Trades)
INSERT IGNORE INTO courses (course_name, course_code, duration_months, description) VALUES
('Electrician',          'ELC', 12, 'Domestic & Industrial Electrician Trade'),
('Plumber',              'PLM', 6,  'Plumbing and Pipefitting Trade'),
('Computer Operator',    'COM', 12, 'Computer Operator & Programming Assistant'),
('Auto Mechanic',        'AUT', 12, 'Automobile Mechanic Trade'),
('Welder',               'WLD', 6,  'Welding and Fabrication Trade'),
('Mason / Civil Works',  'MSN', 6,  'Masonry and Civil Construction Trade'),
('Refrigeration & AC',   'RAC', 12, 'Refrigeration and Air Conditioning Trade');
