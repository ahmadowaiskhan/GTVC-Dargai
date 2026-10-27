-- ============================================================
-- GTVC Dargai — Demo Data Seed (relational, NO .xlsx files)
-- Safe to run multiple times: every INSERT is guarded by NOT EXISTS
-- and every foreign key is resolved by a natural key (code / name).
-- Run with:   mysql -u root gtvc_db < seed_demo_data.sql
--   ...or paste into phpMyAdmin's SQL tab with gtvc_db selected.
--
-- Populates: courses, academic_sessions, teachers (linked to demo
-- users), classes (attach course + teacher), students, enrollments,
-- subjects, results, extra attendance_reports, notices,
-- accounting_transactions.
-- ============================================================

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- 1) COURSES (trades)
-- ------------------------------------------------------------
INSERT INTO courses (course_name, course_code, duration_months, description, is_active)
SELECT m.course_name, m.course_code, m.duration_months, m.description, 1
FROM (
  SELECT 'Diploma in Information Technology'     course_name, 'DIT'  course_code, 18 duration_months, 'Two-year diploma covering networking, programming and web development.' description
  UNION ALL SELECT 'Certificate in Computer & Video Technology', 'CCVT', 12, 'Short certificate course on office applications, typing and multimedia.'
  UNION ALL SELECT 'Graduate in Information Technology',          'GIT',  6, 'Six-month graduate IT skills program.'
  UNION ALL SELECT 'Office Fundamentals & Typing',                'OFT',  3, 'Basic computer literacy and typing course.'
) m
WHERE NOT EXISTS (SELECT 1 FROM courses c WHERE c.course_code = m.course_code);

-- ------------------------------------------------------------
-- 2) ACADEMIC SESSION
-- ------------------------------------------------------------
INSERT INTO academic_sessions (session_name, session_code, start_date, end_date, status, total_admissions, description)
SELECT 'Annual Session 2026-2027', '2026-2027', '2026-04-01', '2027-03-31', 'active', 0, 'Primary running session for all trades.'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM academic_sessions WHERE session_code = '2026-2027');

-- ------------------------------------------------------------
-- 3) TEACHER profiles (linked to the demo users already in `users`)
--    user_id resolved from username; deduped by employee_id.
-- ------------------------------------------------------------
INSERT INTO teachers (user_id, employee_id, cnic, date_of_birth, gender, qualification, specialization, joining_date, address, is_active)
SELECT m.user_id, m.employee_id, m.cnic, m.dob, m.gender, m.qualification, m.specialization, m.joining, 'Dargai, Malakand', 1
FROM (
  SELECT (SELECT id FROM users WHERE username='sir_rehman') user_id, 'GTVC-T-001' employee_id, '17403-2222222-2' cnic, '1990-03-10' dob, 'male'   gender, 'BS Computer Science'       qualification, 'Networking (DIT)'          specialization, '2020-09-01' joining
  UNION ALL SELECT (SELECT id FROM users WHERE username='sir_basir'),  'GTVC-T-002', '17403-3333333-3', '1988-07-22', 'male',   'DACS',                        'Office Automation (CCVT)',   '2021-01-15'
  UNION ALL SELECT (SELECT id FROM users WHERE username='miss_sara'),  'GTVC-T-003', '17403-4444444-4', '1993-11-05', 'female', 'BS Information Technology',   'Web Development (GIT)',      '2022-03-01'
  UNION ALL SELECT (SELECT id FROM users WHERE username='sir_waqas'),  'GTVC-T-004', '17403-5555555-5', '1991-05-30', 'male',   'ADCS',                        'Hardware & Networking',      '2023-08-15'
) m
WHERE m.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM teachers t WHERE t.employee_id = m.employee_id);

-- ------------------------------------------------------------
-- 4) Attach courses + teachers to the 3 demo classes (natural keys)
-- ------------------------------------------------------------
UPDATE classes SET course_id = (SELECT id FROM courses WHERE course_code='DIT'),
       teacher_id = (SELECT t.id FROM teachers t JOIN users u ON t.user_id=u.id WHERE u.username='sir_rehman')
 WHERE class_name = 'DIT — Morning';

UPDATE classes SET course_id = (SELECT id FROM courses WHERE course_code='CCVT'),
       teacher_id = (SELECT t.id FROM teachers t JOIN users u ON t.user_id=u.id WHERE u.username='sir_basir')
 WHERE class_name = 'CCVT — Evening';

UPDATE classes SET course_id = (SELECT id FROM courses WHERE course_code='GIT'),
       teacher_id = (SELECT t.id FROM teachers t JOIN users u ON t.user_id=u.id WHERE u.username='miss_sara')
 WHERE class_name = 'GIT — Weekend';

-- ------------------------------------------------------------
-- 5) STUDENTS (12 — 4 per class). applied_course resolved by course_code.
-- ------------------------------------------------------------
INSERT INTO students (student_id, full_name, father_name, cnic, date_of_birth, gender, phone, district, admission_date, status, applied_course_id, degree_status, session_id)
SELECT m.student_id, m.full_name, m.father_name, m.cnic, m.dob, m.gender, m.phone, 'Dargai', m.admission_date, 'active', co.id, 'enrolled', sess.id
FROM (
  SELECT 'DIT-2026-001' student_id, 'Imran Khan'    full_name, 'Sher Mohammad Khan' father_name, '17403-7000001-1' cnic, '2003-05-12' dob, 'male'   gender, '0311-7000001' phone, '2026-01-15' admission_date, 'DIT' ccode
  UNION ALL SELECT 'DIT-2026-002', 'Shahzaib Ali',   'Muhammad Ali',     '17403-7000002-2', '2002-09-03', 'male',   '0312-7000002', '2026-01-15', 'DIT'
  UNION ALL SELECT 'DIT-2026-003', 'Zubair Khan',    'Noor Mohammad',    '17403-7000003-3', '2004-01-20', 'male',   '0313-7000003', '2026-01-15', 'DIT'
  UNION ALL SELECT 'DIT-2026-004', 'Hira Noor',      'Abdul Noor',       '17403-7000004-4', '2003-11-11', 'female', '0314-7000004', '2026-01-15', 'DIT'
  UNION ALL SELECT 'CCVT-2026-001','Bilal Ahmed',    'Sahib Ahmed',      '17403-7000005-5', '2001-06-18', 'male',   '0315-7000005', '2026-02-01', 'CCVT'
  UNION ALL SELECT 'CCVT-2026-002','Usman Ghani',    'Ghaniullah Khan',  '17403-7000006-6', '2002-03-25', 'male',   '0316-7000006', '2026-02-01', 'CCVT'
  UNION ALL SELECT 'CCVT-2026-003','Ayesha Bibi',    'Muhammad Nawaz',   '17403-7000007-7', '2004-08-09', 'female', '0317-7000007', '2026-02-01', 'CCVT'
  UNION ALL SELECT 'CCVT-2026-004','Sahar Gul',      'Alam Gul',         '17403-7000008-8', '2003-02-14', 'female', '0318-7000008', '2026-02-01', 'CCVT'
  UNION ALL SELECT 'GIT-2026-001', 'Hamza Khan',     'Aslam Khan',       '17403-7000009-9', '2000-12-01', 'male',   '0319-7000009', '2026-02-15', 'GIT'
  UNION ALL SELECT 'GIT-2026-002', 'Adnan Yousaf',   'Yousaf Ali',       '17403-7000010-0', '2001-07-07', 'male',   '0320-7000010', '2026-02-15', 'GIT'
  UNION ALL SELECT 'GIT-2026-003', 'Fatima Noor',    'Noor-ul-Amin',     '17403-7000011-1', '2003-04-30', 'female', '0321-7000011', '2026-02-15', 'GIT'
  UNION ALL SELECT 'GIT-2026-004', 'Daniyal Aziz',   'Abdul Aziz',       '17403-7000012-2', '2002-10-16', 'male',   '0322-7000012', '2026-02-15', 'GIT'
) m
JOIN courses co ON co.course_code = m.ccode
CROSS JOIN (SELECT id FROM academic_sessions WHERE session_code = '2026-2027' LIMIT 1) sess
WHERE NOT EXISTS (SELECT 1 FROM students s WHERE s.student_id = m.student_id);

-- Keep the session's admission count in sync
UPDATE academic_sessions SET total_admissions = (SELECT COUNT(*) FROM students WHERE status = 'active')
 WHERE session_code = '2026-2027';

-- ------------------------------------------------------------
-- 6) ENROLLMENTS (each student into the class that teaches their course)
-- ------------------------------------------------------------
INSERT INTO enrollments (student_id, class_id, roll_number, enrolled_at)
SELECT st.id, cl.id, st.student_id, NOW()
FROM students st
JOIN classes cl ON cl.course_id = st.applied_course_id
WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = st.id AND e.class_id = cl.id);

-- ------------------------------------------------------------
-- 7) SUBJECTS (3 per trade)
-- ------------------------------------------------------------
INSERT INTO subjects (subject_name, subject_code, course_id, total_marks, pass_marks, session_id)
SELECT m.subject_name, m.subject_code, co.id, m.total_marks, m.pass_marks, sess.id
FROM (
  SELECT 'Networking Fundamentals' subject_name, 'DIT-101'  subject_code, 'DIT'  ccode, 100 total_marks, 40 pass_marks
  UNION ALL SELECT 'Programming (C++)',            'DIT-102', 'DIT',  100, 40
  UNION ALL SELECT 'Web Development',              'DIT-103', 'DIT',  100, 40
  UNION ALL SELECT 'MS Office & Typing',           'CCVT-201','CCVT', 100, 40
  UNION ALL SELECT 'Graphics Design',              'CCVT-202','CCVT', 100, 40
  UNION ALL SELECT 'Video Editing Basics',         'CCVT-203','CCVT', 100, 40
  UNION ALL SELECT 'Database Management',          'GIT-301', 'GIT',  100, 40
  UNION ALL SELECT 'HTML/CSS & JavaScript',        'GIT-302', 'GIT',  100, 40
  UNION ALL SELECT 'Computer Hardware',            'GIT-303', 'GIT',  100, 40
) m
JOIN courses co ON co.course_code = m.ccode
CROSS JOIN (SELECT id FROM academic_sessions WHERE session_code = '2026-2027' LIMIT 1) sess
WHERE NOT EXISTS (SELECT 1 FROM subjects s WHERE s.subject_code = m.subject_code);

-- ------------------------------------------------------------
-- 8) RESULTS (one 'monthly' exam per student per subject of their class)
--    Marks vary deterministically; grade derived from percentage.
-- ------------------------------------------------------------
INSERT INTO results (student_id, class_id, subject_id, exam_type, marks_obtained, total_marks, grade, entered_by, exam_date)
SELECT d.student_id, d.class_id, d.subject_id, 'monthly', d.marks_obtained, d.total_marks, d.grade, d.entered_by, d.exam_date
FROM (
  SELECT e.student_id, e.class_id, sub.id AS subject_id,
         sub.total_marks,
         FLOOR(sub.total_marks * (0.55 + (sub.id % 6) * 0.08)) AS marks_obtained,
         CASE
           WHEN (0.55 + (sub.id % 6) * 0.08) >= 0.80 THEN 'A-1'
           WHEN (0.55 + (sub.id % 6) * 0.08) >= 0.70 THEN 'A'
           WHEN (0.55 + (sub.id % 6) * 0.08) >= 0.60 THEN 'B'
           WHEN (0.55 + (sub.id % 6) * 0.08) >= 0.50 THEN 'C'
           ELSE 'F'
         END AS grade,
         (SELECT id FROM users WHERE username = 'admin') AS entered_by,
         '2026-09-30' AS exam_date
  FROM enrollments e
  JOIN classes cl  ON cl.id = e.class_id
  JOIN subjects sub ON sub.course_id = cl.course_id
) d
WHERE d.entered_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM results r
    WHERE r.student_id = d.student_id AND r.subject_id = d.subject_id AND r.exam_type = 'monthly'
  );

-- ------------------------------------------------------------
-- 9) EXTRA attendance_reports (2025) — gives the Year filter 2025 + 2026.
--    No file attached (file_name / file_path left NULL).
-- ------------------------------------------------------------
INSERT INTO attendance_reports (class_id, month, year, percentage, total_students, submitted_by_name)
SELECT c.id, m.month, 2025, m.percentage, m.total_students, 'Demo Teacher'
FROM (
  SELECT 'DIT — Morning' cname, 5 month, 83.20 percentage, 38 total_students
  UNION ALL SELECT 'DIT — Morning', 6, 90.10, 38
  UNION ALL SELECT 'CCVT — Evening', 5, 70.00, 33
  UNION ALL SELECT 'CCVT — Evening', 6, 76.50, 33
  UNION ALL SELECT 'GIT — Weekend',  5, 58.40, 24
  UNION ALL SELECT 'GIT — Weekend',  6, 64.00, 24
) m
JOIN classes c ON c.class_name = m.cname
WHERE NOT EXISTS (
  SELECT 1 FROM attendance_reports ar WHERE ar.class_id = c.id AND ar.month = m.month AND ar.year = 2025
);

-- ------------------------------------------------------------
-- 10) NOTICES
-- ------------------------------------------------------------
INSERT INTO notices (title, content, posted_by, target_role, is_active, created_at)
SELECT m.title, m.content, u.id, m.target_role, 1, NOW()
FROM (
  SELECT 'Mid-Term Exams Schedule' title, 'Mid-term examinations for all trades will begin 15 November 2026. Allocations of dates will be shared by the section in-charge.' content, 'all' target_role
  UNION ALL SELECT 'Holiday Notice', 'The center will remain closed on 06 October 2026 on account of Prophet Muhammad (PBUH) birthday.', 'all'
  UNION ALL SELECT 'New Batches Opening', 'Admissions are open for the January 2027 batches in DIT, CCVT and GIT. Submit enrollment requests to the front desk.', 'teacher'
) m
JOIN users u ON u.username = 'admin'
WHERE NOT EXISTS (SELECT 1 FROM notices n WHERE n.title = m.title);

-- ------------------------------------------------------------
-- 11) ACCOUNTING transactions (income + expense)
-- ------------------------------------------------------------
INSERT INTO accounting_transactions (title, category, type, amount, payment_method, receipt_number, receipt_date, paid_to_or_from, description, recorded_by, recorded_by_name)
SELECT m.title, m.category, m.type, m.amount, 'Cash', m.receipt_number, m.receipt_date, m.party, m.description, a.id, a.full_name
FROM (
  SELECT 'DIT Fee — Imran Khan'               title, 'Student Fees'   category, 'income'  type, 15000 amount, 'GTVC-INC-001' receipt_number, '2026-09-05' receipt_date, 'Imran Khan'        party, 'First installment of diploma fee.' description
  UNION ALL SELECT 'CCVT Fee — Bilal Ahmed',        'Student Fees',    'income',  12000, 'GTVC-INC-002', '2026-09-08', 'Bilal Ahmed',       'Certificate course fee.'
  UNION ALL SELECT 'GIT Fee — Hamza Khan',          'Student Fees',    'income',   8000, 'GTVC-INC-003', '2026-09-12', 'Hamza Khan',        'Graduate program fee.'
  UNION ALL SELECT 'Teacher Salaries — September',  'Salaries',        'expense', 95000, 'GTVC-EXP-001', '2026-09-30', 'All Staff',         'Monthly salary disbursement.'
  UNION ALL SELECT 'Electricity Bill',              'Utilities',       'expense',  7500, 'GTVC-EXP-002', '2026-09-15', 'LESCO',             'September electricity charges.'
  UNION ALL SELECT 'Computer Parts Purchase',       'Equipment',       'expense', 22000, 'GTVC-EXP-003', '2026-09-20', 'Tech Supplies Dargai','Replacement RAM and SSDs for lab.'
) m
JOIN users a ON a.username = 'admin'
WHERE NOT EXISTS (SELECT 1 FROM accounting_transactions x WHERE x.receipt_number = m.receipt_number);

-- ============================================================
-- Summary after running:
--   4 courses, 1 session, 4 teachers, 12 students, 12 enrollments,
--   9 subjects, results (12 students x their class subjects),
--   +6 attendance_reports (2025), 3 notices, 6 accounting entries.
-- Re-running this file will NOT create duplicates.
-- ============================================================
