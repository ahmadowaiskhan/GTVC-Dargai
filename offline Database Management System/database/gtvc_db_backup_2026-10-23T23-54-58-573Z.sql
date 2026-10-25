-- ============================================================
-- GTVC Dargai Database Complete Backup & Schema Export
-- Export Date: 2026-10-23T23:54:58.563Z
-- Host: 127.0.0.1 | Database: gtvc_db
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Structure for table `academic_sessions`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `academic_sessions`;
CREATE TABLE `academic_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_name` varchar(150) NOT NULL,
  `session_code` varchar(50) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('upcoming','active','completed') DEFAULT 'active',
  `total_admissions` int(11) DEFAULT 0,
  `description` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_code` (`session_code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `academic_sessions` (4 records)
INSERT INTO `academic_sessions` (`id`, `session_name`, `session_code`, `start_date`, `end_date`, `status`, `total_admissions`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Session 2024-2025 (Annual)', 'SESS-2024-25', '2024-08-31 19:00:00', '2025-08-30 19:00:00', 'active', 155, 'Current active academic batch for all regular vocational and technical trades.', '2026-10-23 22:53:35', '2026-10-23 22:53:35'),
(2, 'Session 2023-2024 (Annual)', 'SESS-2023-24', '2023-08-31 19:00:00', '2024-08-30 19:00:00', 'completed', 142, 'Completed academic session. All board exams finished, diplomas verified.', '2026-10-23 22:53:35', '2026-10-23 22:53:35'),
(3, 'Session 2022-2023 (Annual)', 'SESS-2022-23', '2022-08-31 19:00:00', '2023-08-30 19:00:00', 'completed', 126, 'Past completed session. Certificates awarded.', '2026-10-23 22:53:35', '2026-10-23 22:53:35'),
(4, 'Session 2025-2026 (Upcoming)', 'SESS-2025-26', '2025-08-31 19:00:00', '2026-08-30 19:00:00', 'upcoming', 0, 'Upcoming admission campaign scheduled for Autumn 2025.', '2026-10-23 22:53:35', '2026-10-23 22:53:35');

-- ------------------------------------------------------------
-- Structure for table `accounting_transactions`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `accounting_transactions`;
CREATE TABLE `accounting_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT 'Cash',
  `receipt_number` varchar(100) DEFAULT NULL,
  `receipt_image` longtext DEFAULT NULL,
  `receipt_date` date NOT NULL,
  `paid_to_or_from` varchar(150) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `recorded_by_name` varchar(150) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- Structure for table `attendance`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent','leave','late') NOT NULL,
  `marked_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_attendance` (`student_id`,`class_id`,`date`),
  KEY `class_id` (`class_id`),
  KEY `marked_by` (`marked_by`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_ibfk_3` FOREIGN KEY (`marked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- Structure for table `classes`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `classes`;
CREATE TABLE `classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_name` varchar(150) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `session_year` varchar(50) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  `session_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `classes_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `classes_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- Structure for table `courses`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_name` varchar(150) NOT NULL,
  `course_code` varchar(50) DEFAULT NULL,
  `duration_months` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `course_code` (`course_code`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `courses` (10 records)
INSERT INTO `courses` (`id`, `course_name`, `course_code`, `duration_months`, `description`, `is_active`) VALUES
(1, 'Electrician', 'ELC', 12, 'Domestic & Industrial Electrician Trade', 1),
(2, 'Plumber', 'PLM', 6, 'Plumbing and Pipefitting Trade', 1),
(3, 'Computer Operator', 'COM', 12, 'Computer Operator & Programming Assistant', 1),
(4, 'Auto Mechanic', 'AUT', 12, 'Automobile Mechanic Trade', 1),
(5, 'Welder', 'WLD', 6, 'Welding and Fabrication Trade', 1),
(6, 'Mason / Civil Works', 'MSN', 6, 'Masonry and Civil Construction Trade', 1),
(7, 'Refrigeration & AC', 'RAC', 12, 'Refrigeration and Air Conditioning Trade', 1),
(8, 'DIT (Diploma in Information Technology)', 'DIT', 12, '1-Year Board of Technical Education Diploma in IT', 1),
(9, 'CCVT (Civil & Computer Vocational Training)', 'CCVT', 12, 'Technical & Vocational Certification in Computer and Civil Draftsmanship', 1),
(10, 'GIT (Graphic Information Technology)', 'GIT', 6, 'Graphic Design, Multimedia & UI/UX Vocational Program', 1);

-- ------------------------------------------------------------
-- Structure for table `edit_log`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `edit_log`;
CREATE TABLE `edit_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `target_table` varchar(100) NOT NULL,
  `target_id` int(11) NOT NULL,
  `action` enum('create','update','delete','restore') NOT NULL,
  `old_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_data`)),
  `new_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_data`)),
  `edited_by` int(11) DEFAULT NULL,
  `edited_by_name` varchar(150) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `edit_log` (4 records)
INSERT INTO `edit_log` (`id`, `target_table`, `target_id`, `action`, `old_data`, `new_data`, `edited_by`, `edited_by_name`, `description`, `created_at`) VALUES
(5, 'database_backups', 2147483647, 'create', NULL, '[{"locationId":1,"locationName":"Default Project Database Folder","path":"C:\\\\Users\\\\A.Owais khan\\\\Desktop\\\\GTVC Website\\\\offline Database Management System\\\\database","partition":"C:","success":true,"fileSizeMB":"0.023","fileName":"gtvc_db_backup_2026-10-23T23-09-49-724Z.sql"}]', 1, 'System Administrator', 'Exported full database backup to 1 storage locations (gtvc_db_backup_2026-10-23T23-09-49-724Z.sql)', '2026-10-23 23:09:49'),
(6, 'storage_locations', 2147483647, 'create', NULL, '{"id":1792797396868,"name":"Drive D Redundant Storage","path":"D:\\\\GTVC_Database_Backup","partition":"D:","isPrimary":false,"autoBackup":true,"lastBackupAt":null,"createdAt":"2026-10-23T23:16:36.868Z"}', 1, 'System Administrator', 'Added database storage folder location "D:\\GTVC_Database_Backup" on drive D:', '2026-10-23 23:16:36'),
(7, 'database_backups', 2147483647, 'create', NULL, '[{"locationId":1,"locationName":"Default Project Database Folder","path":"C:\\\\Users\\\\A.Owais khan\\\\Desktop\\\\GTVC Website\\\\offline Database Management System\\\\database","partition":"C:","success":true,"fileSizeMB":"0.024","fileName":"gtvc_db_backup_2026-10-23T23-16-52-300Z.sql"},{"locationId":1792797396868,"locationName":"Drive D Redundant Storage","path":"D:\\\\GTVC_Database_Backup","partition":"D:","success":true,"fileSizeMB":"0.024","fileName":"gtvc_db_backup_2026-10-23T23-16-52-300Z.sql"}]', 1, 'System Administrator', 'Exported full database backup to 2 storage locations (gtvc_db_backup_2026-10-23T23-16-52-300Z.sql)', '2026-10-23 23:16:52'),
(8, 'database_backups', 2147483647, 'create', NULL, '[{"locationId":1,"locationName":"Default Project Database Folder","path":"C:\\\\Users\\\\A.Owais khan\\\\Desktop\\\\GTVC Website\\\\offline Database Management System\\\\database","partition":"C:","success":true,"fileSizeMB":"0.025","fileName":"gtvc_db_backup_2026-10-23T23-52-08-675Z.sql"},{"locationId":1792797396868,"locationName":"Drive D Redundant Storage","path":"D:\\\\GTVC_Database_Backup","partition":"D:","success":true,"fileSizeMB":"0.025","fileName":"gtvc_db_backup_2026-10-23T23-52-08-675Z.sql"}]', 1, 'Administrator (Offline Demo)', 'Exported full database backup to 2 storage locations (gtvc_db_backup_2026-10-23T23-52-08-675Z.sql)', '2026-10-23 23:52:08');

-- ------------------------------------------------------------
-- Structure for table `enrollments`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `enrollments`;
CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `roll_number` varchar(50) DEFAULT NULL,
  `enrolled_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_student_class` (`student_id`,`class_id`),
  KEY `class_id` (`class_id`),
  CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- Structure for table `notices`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `notices`;
CREATE TABLE `notices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `posted_by` int(11) DEFAULT NULL,
  `target_role` varchar(50) DEFAULT 'all',
  `file_path` varchar(255) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `posted_by` (`posted_by`),
  CONSTRAINT `notices_ibfk_1` FOREIGN KEY (`posted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- Structure for table `recycle_bin`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `recycle_bin`;
CREATE TABLE `recycle_bin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `original_table` varchar(100) NOT NULL,
  `original_id` int(11) NOT NULL,
  `record_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`record_data`)),
  `deleted_by` int(11) DEFAULT NULL,
  `deleted_by_name` varchar(150) DEFAULT NULL,
  `deleted_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- Structure for table `results`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `results`;
CREATE TABLE `results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `exam_type` enum('monthly','midterm','final','practical') NOT NULL,
  `marks_obtained` decimal(5,2) DEFAULT NULL,
  `total_marks` decimal(5,2) DEFAULT 100.00,
  `grade` varchar(10) DEFAULT NULL,
  `entered_by` int(11) DEFAULT NULL,
  `exam_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `class_id` (`class_id`),
  KEY `subject_id` (`subject_id`),
  KEY `entered_by` (`entered_by`),
  CONSTRAINT `results_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `results_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `results_ibfk_3` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `results_ibfk_4` FOREIGN KEY (`entered_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- Structure for table `site_settings`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `site_settings`;
CREATE TABLE `site_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `site_settings` (6 records)
INSERT INTO `site_settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('admission_deadline', '2026-11-30', '2026-10-21 00:13:29'),
('admission_description', 'Government Technical & Vocational Centre Dargai announces admissions for Technical & Vocational Trades: Electrical, Auto Mechanic, Plumbing, Computer Operator, Welding, and RAC trades.', '2026-10-21 00:13:29'),
('admission_email', 'admissions@gtvcdargai.edu.pk', '2026-10-21 00:13:29'),
('admission_open', '1', '2026-10-21 00:13:29'),
('admission_phone', '0932-411234', '2026-10-21 00:13:29'),
('admission_title', 'Admissions Open for Session 2026-2027 — Apply Today!', '2026-10-21 00:13:29');

-- ------------------------------------------------------------
-- Structure for table `students`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(50) DEFAULT NULL,
  `full_name` varchar(150) NOT NULL,
  `father_name` varchar(150) DEFAULT NULL,
  `cnic` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `district` varchar(100) DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `admission_date` date DEFAULT NULL,
  `status` enum('active','passed','dropped','absent') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `email` varchar(150) DEFAULT NULL,
  `applied_course_id` int(11) DEFAULT NULL,
  `applied_date` date DEFAULT NULL,
  `degree_status` enum('enrolled','in_progress','completed','degree_awarded','dropped') DEFAULT 'enrolled',
  `completion_date` date DEFAULT NULL,
  `study_plan` text DEFAULT NULL,
  `projects` text DEFAULT NULL,
  `session_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`),
  UNIQUE KEY `cnic` (`cnic`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `students` (9 records)
INSERT INTO `students` (`id`, `student_id`, `full_name`, `father_name`, `cnic`, `date_of_birth`, `gender`, `phone`, `address`, `district`, `photo_path`, `admission_date`, `status`, `created_at`, `email`, `applied_course_id`, `applied_date`, `degree_status`, `completion_date`, `study_plan`, `projects`, `session_id`) VALUES
(1, 'STU-2024-001', 'Muhammad Usman Khan', 'Tariq Khan', '15402-1234567-1', NULL, NULL, '0300-1112233', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 8, NULL, 'enrolled', NULL, NULL, NULL, 1),
(2, 'STU-2024-002', 'Ahmad Bilal', 'Muhammad Zahir', '15402-2345678-3', NULL, NULL, '0301-2223344', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 8, NULL, 'enrolled', NULL, NULL, NULL, 1),
(3, 'STU-2024-003', 'Sohail Ahmad', 'Bakhtiar Ahmad', '15402-3456789-5', NULL, NULL, '0302-3334455', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 8, NULL, 'enrolled', NULL, NULL, NULL, 1),
(4, 'STU-2024-004', 'Hamza Farooq', 'Farooq Shah', '15402-4567890-7', NULL, NULL, '0303-4445566', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 9, NULL, 'enrolled', NULL, NULL, NULL, 1),
(5, 'STU-2024-005', 'Zia Ullah', 'Inayat Ullah', '15402-5678901-9', NULL, NULL, '0304-5556677', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 9, NULL, 'enrolled', NULL, NULL, NULL, 1),
(6, 'STU-2024-006', 'Kamran Ali', 'Sher Ali', '15402-6789012-1', NULL, NULL, '0305-6667788', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 10, NULL, 'enrolled', NULL, NULL, NULL, 1),
(7, 'STU-2024-007', 'Noman Khan', 'Said Rahman', '15402-7890123-3', NULL, NULL, '0306-7778899', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 10, NULL, 'enrolled', NULL, NULL, NULL, 1),
(8, 'STU-2024-008', 'Asad Iqbal', 'Iqbal Hussain', '15402-8901234-5', NULL, NULL, '0307-8889900', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 1, NULL, 'enrolled', NULL, NULL, NULL, 1),
(9, 'STU-2024-009', 'Rashid Mehmood', 'Mehmood Jan', '15402-9012345-7', NULL, NULL, '0308-9990011', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 3, NULL, 'enrolled', NULL, NULL, NULL, 1);

-- ------------------------------------------------------------
-- Structure for table `subjects`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `subjects`;
CREATE TABLE `subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subject_name` varchar(150) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `total_marks` int(11) DEFAULT 100,
  `pass_marks` int(11) DEFAULT 40,
  `session_id` int(11) DEFAULT NULL,
  `subject_code` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `subjects` (18 records)
INSERT INTO `subjects` (`id`, `subject_name`, `course_id`, `total_marks`, `pass_marks`, `session_id`, `subject_code`) VALUES
(1, 'Office Automation & MS Office', 8, 100, 40, NULL, 'DIT-101'),
(2, 'Web Design & HTML/CSS', 8, 100, 40, NULL, 'DIT-102'),
(3, 'Database Management & SQL', 8, 100, 40, NULL, 'DIT-103'),
(4, 'Programming in C/C++', 8, 100, 40, NULL, 'DIT-104'),
(5, 'Operating Systems & Networking', 8, 100, 40, NULL, 'DIT-105'),
(6, 'Civil Drawing & CAD Fundamentals', 9, 100, 40, NULL, 'CCVT-101'),
(7, 'Building Construction & Materials', 9, 100, 40, NULL, 'CCVT-102'),
(8, 'Computer Application for Estimations', 9, 100, 40, NULL, 'CCVT-103'),
(9, 'Surveying & Leveling Techniques', 9, 100, 40, NULL, 'CCVT-104'),
(10, 'Adobe Photoshop & Photo Editing', 10, 100, 40, NULL, 'GIT-101'),
(11, 'Vector Graphics with Illustrator', 10, 100, 40, NULL, 'GIT-102'),
(12, 'Digital Typography & Brand Design', 10, 100, 40, NULL, 'GIT-103'),
(13, 'UI/UX Basics & Figma Prototyping', 10, 100, 40, NULL, 'GIT-104'),
(14, 'Electrical Circuit Fundamentals', 1, 100, 40, NULL, 'ELC-101'),
(15, 'Domestic Wiring & Installation', 1, 100, 40, NULL, 'ELC-102'),
(16, 'Industrial Motor Control & PLC', 1, 100, 40, NULL, 'ELC-103'),
(17, 'Computer Fundamentals & Hardware', 3, 100, 40, NULL, 'COM-101'),
(18, 'Typing & Office Documentation', 3, 100, 40, NULL, 'COM-102');

-- ------------------------------------------------------------
-- Structure for table `teachers`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `teachers`;
CREATE TABLE `teachers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `employee_id` varchar(50) DEFAULT NULL,
  `cnic` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `qualification` varchar(150) DEFAULT NULL,
  `specialization` varchar(150) DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  UNIQUE KEY `cnic` (`cnic`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ------------------------------------------------------------
-- Structure for table `user_activity_timeline`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `user_activity_timeline`;
CREATE TABLE `user_activity_timeline` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `role` varchar(50) DEFAULT NULL,
  `login_time` datetime NOT NULL DEFAULT current_timestamp(),
  `logout_time` datetime DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT '127.0.0.1',
  `user_agent` text DEFAULT NULL,
  `status` enum('active','logged_out','session_timeout') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `user_activity_timeline` (10 records)
INSERT INTO `user_activity_timeline` (`id`, `user_id`, `username`, `full_name`, `role`, `login_time`, `logout_time`, `duration_minutes`, `ip_address`, `user_agent`, `status`, `created_at`) VALUES
(1, 1, 'admin', 'System Administrator', 'admin', '2026-10-21 03:15:32', '2026-10-23 20:11:52', 3896, '::1', 'Browser', 'logged_out', '2026-10-21 03:15:32'),
(2, 1, 'admin', 'System Administrator', 'admin', '2026-10-23 09:52:40', '2026-10-23 09:52:40', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', 'logged_out', '2026-10-23 09:52:40'),
(3, 1, 'admin', 'System Administrator', 'admin', '2026-10-23 20:04:43', '2026-10-23 20:04:43', 0, '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36', 'logged_out', '2026-10-23 20:04:43'),
(4, 1, 'admin', 'System Administrator', 'admin', '2026-10-23 22:58:30', '2026-10-23 23:39:43', 41, '::1', 'Browser', 'logged_out', '2026-10-23 22:58:30'),
(5, 1, 'admin', 'System Administrator', 'admin', '2026-10-23 22:58:44', '2026-10-23 23:39:42', 40, '::1', 'Browser', 'logged_out', '2026-10-23 22:58:44'),
(6, 1, 'admin', 'System Administrator', 'admin', '2026-10-23 23:09:04', '2026-10-23 23:39:42', 30, '::1', 'Browser', 'logged_out', '2026-10-23 23:09:04'),
(7, 1, 'admin', 'System Administrator', 'admin', '2026-10-23 23:09:49', '2026-10-23 23:39:41', 29, '::1', 'Browser', 'logged_out', '2026-10-23 23:09:49'),
(8, 1, 'admin', 'System Administrator', 'admin', '2026-10-23 23:16:36', '2026-10-23 23:21:45', 5, '::1', 'Browser', 'logged_out', '2026-10-23 23:16:36'),
(9, 1, 'admin', 'System Administrator', 'admin', '2026-10-23 23:16:52', '2026-10-23 23:21:42', 4, '::1', 'Browser', 'logged_out', '2026-10-23 23:16:52'),
(10, 1, 'admin', 'System Administrator', 'admin', '2026-10-23 23:17:35', '2026-10-23 23:21:36', 4, '::1', 'Browser', 'logged_out', '2026-10-23 23:17:35');

-- ------------------------------------------------------------
-- Structure for table `users`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `role` enum('admin','principal','teacher') NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `is_active` tinyint(4) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `employee_id` varchar(50) DEFAULT NULL,
  `cnic` varchar(30) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `joining_date` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `qualification` varchar(150) DEFAULT NULL,
  `specialization` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `users` (3 records)
INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `role`, `email`, `phone`, `is_active`, `created_at`, `updated_at`, `employee_id`, `cnic`, `date_of_birth`, `joining_date`, `gender`, `qualification`, `specialization`, `address`) VALUES
(1, 'admin', '$2a$10$oMvNFpdquxq.wVgg1MT/G.fZJaz2E9pCSMT53WkYPi3ujbmsy6Mwi', 'System Administrator', 'admin', NULL, '0300-0000000', 1, '2026-10-20 22:02:40', '2026-10-21 02:33:24', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 'admin2', '$2a$10$nucCborvQmzezxRoVU1UzuVerWDgBsdbmy/KoMtgbXruAWNI9oVxm', 'Admin User', 'admin', NULL, NULL, 1, '2026-10-20 22:53:31', '2026-10-20 22:53:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 'nomankhan', '$2a$10$.POZrsm1FWBRe3KD/GlsR.YZ0F3YAjgxPvnSMORj5GTYJrKjstVUy', 'mano khan', 'teacher', 'manokhankhan291@gmail.com', '03271697695', 1, '2026-10-20 21:02:44', '2026-10-20 21:02:44', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

SET FOREIGN_KEY_CHECKS = 1;
