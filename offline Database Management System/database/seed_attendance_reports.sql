-- ============================================================
-- GTVC Dargai — Seed: attendance_reports (dummy data, NO .xlsx files)
-- Safe to run multiple times (uses IF NOT EXISTS / INSERT IGNORE).
-- Run with:  mysql -u root gtvc_db < seed_attendance_reports.sql
-- ============================================================

SET NAMES utf8mb4;

-- 1) Ensure the table exists (matches the schema created by server.js)
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

-- 2) Ensure the demo classes exist (created only if missing)
INSERT INTO classes (class_name, session_year, is_active)
SELECT 'DIT — Morning', '2026-2027', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_name = 'DIT — Morning');

INSERT INTO classes (class_name, session_year, is_active)
SELECT 'CCVT — Evening', '2026-2027', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_name = 'CCVT — Evening');

INSERT INTO classes (class_name, session_year, is_active)
SELECT 'GIT — Weekend', '2026-2027', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE class_name = 'GIT — Weekend');

-- 3) Insert dummy monthly reports (file_name / file_path left NULL = no .xlsx)
--    DIT — Morning (40 students)
INSERT IGNORE INTO attendance_reports (class_id, month, year, percentage, total_students, submitted_by_name)
SELECT id, 7,  2026, 88.50, 40, 'Demo Teacher' FROM classes WHERE class_name = 'DIT — Morning';
INSERT IGNORE INTO attendance_reports (class_id, month, year, percentage, total_students, submitted_by_name)
SELECT id, 8,  2026, 91.20, 40, 'Demo Teacher' FROM classes WHERE class_name = 'DIT — Morning';
INSERT IGNORE INTO attendance_reports (class_id, month, year, percentage, total_students, submitted_by_name)
SELECT id, 9,  2026, 79.00, 40, 'Demo Teacher' FROM classes WHERE class_name = 'DIT — Morning';
INSERT IGNORE INTO attendance_reports (class_id, month, year, percentage, total_students, submitted_by_name)
SELECT id, 10, 2026, 95.40, 40, 'Demo Teacher' FROM classes WHERE class_name = 'DIT — Morning';

--    CCVT — Evening (35 students)
INSERT IGNORE INTO attendance_reports (class_id, month, year, percentage, total_students, submitted_by_name)
SELECT id, 7,  2026, 72.30, 35, 'Demo Teacher' FROM classes WHERE class_name = 'CCVT — Evening';
INSERT IGNORE INTO attendance_reports (class_id, month, year, percentage, total_students, submitted_by_name)
SELECT id, 8,  2026, 68.90, 35, 'Demo Teacher' FROM classes WHERE class_name = 'CCVT — Evening';
INSERT IGNORE INTO attendance_reports (class_id, month, year, percentage, total_students, submitted_by_name)
SELECT id, 9,  2026, 84.10, 35, 'Demo Teacher' FROM classes WHERE class_name = 'CCVT — Evening';
INSERT IGNORE INTO attendance_reports (class_id, month, year, percentage, total_students, submitted_by_name)
SELECT id, 10, 2026, 90.00, 35, 'Demo Teacher' FROM classes WHERE class_name = 'CCVT — Evening';

--    GIT — Weekend (25 students)
INSERT IGNORE INTO attendance_reports (class_id, month, year, percentage, total_students, submitted_by_name)
SELECT id, 7,  2026, 55.00, 25, 'Demo Teacher' FROM classes WHERE class_name = 'GIT — Weekend';
INSERT IGNORE INTO attendance_reports (class_id, month, year, percentage, total_students, submitted_by_name)
SELECT id, 8,  2026, 61.50, 25, 'Demo Teacher' FROM classes WHERE class_name = 'GIT — Weekend';
INSERT IGNORE INTO attendance_reports (class_id, month, year, percentage, total_students, submitted_by_name)
SELECT id, 9,  2026, 49.80, 25, 'Demo Teacher' FROM classes WHERE class_name = 'GIT — Weekend';
INSERT IGNORE INTO attendance_reports (class_id, month, year, percentage, total_students, submitted_by_name)
SELECT id, 10, 2026, 77.70, 25, 'Demo Teacher' FROM classes WHERE class_name = 'GIT — Weekend';

-- Done: 12 report rows across 3 classes, none with an attached file.
