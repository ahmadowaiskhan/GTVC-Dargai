-- ============================================================
-- GTVC Dargai Database Complete Backup & Schema Export
-- Export Date: 2026-10-24T22:39:11.196Z
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `academic_sessions` (3 records)
INSERT INTO `academic_sessions` (`id`, `session_name`, `session_code`, `start_date`, `end_date`, `status`, `total_admissions`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Session 2024-2025 (Annual)', 'SESS-2024-25', '2024-08-31 19:00:00', '2025-08-30 19:00:00', 'active', 155, 'Current active academic batch for all regular vocational and technical trades.', '2026-10-23 22:53:35', '2026-10-23 22:53:35'),
(4, 'Session 2025-2026 (Upcoming)', 'SESS-2025-26', '2025-08-31 19:00:00', '2026-08-30 19:00:00', 'active', 0, 'Upcoming admission campaign scheduled for Autumn 2025.', '2026-10-23 22:53:35', '2026-10-24 20:43:08'),
(5, 'Annual Session 2026-2027', '2026-2027', '2026-03-31 19:00:00', '2027-03-30 19:00:00', 'active', 21, 'Primary running session for all trades.', '2026-10-24 22:02:39', '2026-10-24 22:02:39');

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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `accounting_transactions` (6 records)
INSERT INTO `accounting_transactions` (`id`, `title`, `category`, `type`, `amount`, `payment_method`, `receipt_number`, `receipt_image`, `receipt_date`, `paid_to_or_from`, `description`, `recorded_by`, `recorded_by_name`, `created_at`) VALUES
(1, 'DIT Fee — Imran Khan', 'Student Fees', 'income', '15000.00', 'Cash', 'GTVC-INC-001', NULL, '2026-09-04 19:00:00', 'Imran Khan', 'First installment of diploma fee.', 1, 'System Administrator', '2026-10-24 22:02:39'),
(2, 'CCVT Fee — Bilal Ahmed', 'Student Fees', 'income', '12000.00', 'Cash', 'GTVC-INC-002', NULL, '2026-09-07 19:00:00', 'Bilal Ahmed', 'Certificate course fee.', 1, 'System Administrator', '2026-10-24 22:02:39'),
(3, 'GIT Fee — Hamza Khan', 'Student Fees', 'income', '8000.00', 'Cash', 'GTVC-INC-003', NULL, '2026-09-11 19:00:00', 'Hamza Khan', 'Graduate program fee.', 1, 'System Administrator', '2026-10-24 22:02:39'),
(4, 'Teacher Salaries — September', 'Salaries', 'expense', '95000.00', 'Cash', 'GTVC-EXP-001', NULL, '2026-09-29 19:00:00', 'All Staff', 'Monthly salary disbursement.', 1, 'System Administrator', '2026-10-24 22:02:39'),
(5, 'Electricity Bill', 'Utilities', 'expense', '7500.00', 'Cash', 'GTVC-EXP-002', NULL, '2026-09-14 19:00:00', 'LESCO', 'September electricity charges.', 1, 'System Administrator', '2026-10-24 22:02:39'),
(6, 'Computer Parts Purchase', 'Equipment', 'expense', '22000.00', 'Cash', 'GTVC-EXP-003', NULL, '2026-09-19 19:00:00', 'Tech Supplies Dargai', 'Replacement RAM and SSDs for lab.', 1, 'System Administrator', '2026-10-24 22:02:39');

-- ------------------------------------------------------------
-- Structure for table `admin_notifications`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `admin_notifications`;
CREATE TABLE `admin_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL DEFAULT 'general',
  `dedupe_key` varchar(150) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `is_read` tinyint(4) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dedupe` (`dedupe_key`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `admin_notifications` (3 records)
INSERT INTO `admin_notifications` (`id`, `type`, `dedupe_key`, `title`, `message`, `is_read`, `created_at`) VALUES
(1, 'attendance_missing', 'attendance_missing_2_2026_10', 'Monthly attendance report missing', 'Class "CCVT — Evening" has no attendance report submitted for October 2026.', 0, '2026-10-24 22:18:20'),
(2, 'general', 'sys_welcome', 'Welcome to GTVC Dargai DBMS', 'This is the admin notification center. System alerts (like missing monthly reports) will appear here.', 0, '2026-10-24 22:18:20'),
(3, 'general', 'session_reminder', 'Admission session closing soon', 'The 2026-2027 admission session closes on 31 March 2027. Complete pending enrollments.', 1, '2026-10-24 22:18:20');

-- ------------------------------------------------------------
-- Structure for table `attendance_reports`
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `attendance_reports`;
CREATE TABLE `attendance_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `class_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL,
  `month` tinyint(4) NOT NULL,
  `year` smallint(6) NOT NULL,
  `percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `total_students` int(11) NOT NULL DEFAULT 0,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `submitted_by` int(11) DEFAULT NULL,
  `submitted_by_name` varchar(150) DEFAULT NULL,
  `submitted_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_report` (`class_id`,`month`,`year`),
  CONSTRAINT `ar_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `attendance_reports` (18 records)
INSERT INTO `attendance_reports` (`id`, `class_id`, `teacher_id`, `month`, `year`, `percentage`, `total_students`, `file_name`, `file_path`, `submitted_by`, `submitted_by_name`, `submitted_at`, `updated_at`) VALUES
(1, 1, NULL, 7, 2026, '88.50', 40, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 21:16:25', '2026-10-24 21:16:25'),
(2, 1, NULL, 8, 2026, '91.20', 40, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 21:16:25', '2026-10-24 21:16:25'),
(3, 1, NULL, 9, 2026, '79.00', 40, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 21:16:25', '2026-10-24 21:16:25'),
(4, 1, NULL, 10, 2026, '95.40', 40, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 21:16:25', '2026-10-24 21:16:25'),
(5, 2, NULL, 7, 2026, '72.30', 35, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 21:16:25', '2026-10-24 21:16:25'),
(6, 2, NULL, 8, 2026, '68.90', 35, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 21:16:25', '2026-10-24 21:16:25'),
(7, 2, NULL, 9, 2026, '84.10', 35, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 21:16:25', '2026-10-24 21:16:25'),
(8, 2, NULL, 10, 2026, '90.00', 35, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 21:16:25', '2026-10-24 21:16:25'),
(9, 3, NULL, 7, 2026, '55.00', 25, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 21:16:25', '2026-10-24 21:16:25'),
(10, 3, NULL, 8, 2026, '61.50', 25, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 21:16:25', '2026-10-24 21:16:25'),
(11, 3, NULL, 9, 2026, '49.80', 25, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 21:16:25', '2026-10-24 21:16:25'),
(12, 3, NULL, 10, 2026, '77.70', 25, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 21:16:25', '2026-10-24 21:16:25'),
(17, 1, NULL, 6, 2025, '90.10', 38, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 22:02:39', '2026-10-24 22:02:39'),
(18, 1, NULL, 5, 2025, '83.20', 38, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 22:02:39', '2026-10-24 22:02:39'),
(19, 2, NULL, 6, 2025, '76.50', 33, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 22:02:39', '2026-10-24 22:02:39'),
(20, 2, NULL, 5, 2025, '70.00', 33, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 22:02:39', '2026-10-24 22:02:39'),
(21, 3, NULL, 6, 2025, '64.00', 24, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 22:02:39', '2026-10-24 22:02:39'),
(22, 3, NULL, 5, 2025, '58.40', 24, NULL, NULL, NULL, 'Demo Teacher', '2026-10-24 22:02:39', '2026-10-24 22:02:39');

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `classes` (3 records)
INSERT INTO `classes` (`id`, `class_name`, `course_id`, `teacher_id`, `session_year`, `start_date`, `end_date`, `is_active`, `session_id`) VALUES
(1, 'DIT — Morning', 8, 1, '2026-2027', NULL, NULL, 1, NULL),
(2, 'CCVT — Evening', 9, 2, '2026-2027', NULL, NULL, 1, NULL),
(3, 'GIT — Weekend', 10, 3, '2026-2027', NULL, NULL, 1, NULL);

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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `courses` (11 records)
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
(10, 'GIT (Graphic Information Technology)', 'GIT', 6, 'Graphic Design, Multimedia & UI/UX Vocational Program', 1),
(11, 'Office Fundamentals & Typing', 'OFT', 3, 'Basic computer literacy and typing course.', 1);

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
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `edit_log` (24 records)
INSERT INTO `edit_log` (`id`, `target_table`, `target_id`, `action`, `old_data`, `new_data`, `edited_by`, `edited_by_name`, `description`, `created_at`) VALUES
(5, 'database_backups', 2147483647, 'create', NULL, '[{"locationId":1,"locationName":"Default Project Database Folder","path":"C:\\\\Users\\\\A.Owais khan\\\\Desktop\\\\GTVC Website\\\\offline Database Management System\\\\database","partition":"C:","success":true,"fileSizeMB":"0.023","fileName":"gtvc_db_backup_2026-10-23T23-09-49-724Z.sql"}]', 1, 'System Administrator', 'Exported full database backup to 1 storage locations (gtvc_db_backup_2026-10-23T23-09-49-724Z.sql)', '2026-10-23 23:09:49'),
(6, 'storage_locations', 2147483647, 'create', NULL, '{"id":1792797396868,"name":"Drive D Redundant Storage","path":"D:\\\\GTVC_Database_Backup","partition":"D:","isPrimary":false,"autoBackup":true,"lastBackupAt":null,"createdAt":"2026-10-23T23:16:36.868Z"}', 1, 'System Administrator', 'Added database storage folder location "D:\\GTVC_Database_Backup" on drive D:', '2026-10-23 23:16:36'),
(7, 'database_backups', 2147483647, 'create', NULL, '[{"locationId":1,"locationName":"Default Project Database Folder","path":"C:\\\\Users\\\\A.Owais khan\\\\Desktop\\\\GTVC Website\\\\offline Database Management System\\\\database","partition":"C:","success":true,"fileSizeMB":"0.024","fileName":"gtvc_db_backup_2026-10-23T23-16-52-300Z.sql"},{"locationId":1792797396868,"locationName":"Drive D Redundant Storage","path":"D:\\\\GTVC_Database_Backup","partition":"D:","success":true,"fileSizeMB":"0.024","fileName":"gtvc_db_backup_2026-10-23T23-16-52-300Z.sql"}]', 1, 'System Administrator', 'Exported full database backup to 2 storage locations (gtvc_db_backup_2026-10-23T23-16-52-300Z.sql)', '2026-10-23 23:16:52'),
(8, 'database_backups', 2147483647, 'create', NULL, '[{"locationId":1,"locationName":"Default Project Database Folder","path":"C:\\\\Users\\\\A.Owais khan\\\\Desktop\\\\GTVC Website\\\\offline Database Management System\\\\database","partition":"C:","success":true,"fileSizeMB":"0.025","fileName":"gtvc_db_backup_2026-10-23T23-52-08-675Z.sql"},{"locationId":1792797396868,"locationName":"Drive D Redundant Storage","path":"D:\\\\GTVC_Database_Backup","partition":"D:","success":true,"fileSizeMB":"0.025","fileName":"gtvc_db_backup_2026-10-23T23-52-08-675Z.sql"}]', 1, 'Administrator (Offline Demo)', 'Exported full database backup to 2 storage locations (gtvc_db_backup_2026-10-23T23-52-08-675Z.sql)', '2026-10-23 23:52:08'),
(9, 'database_backups', 2147483647, 'create', NULL, '[{"locationId":1,"locationName":"Default Project Database Folder","path":"C:\\\\Users\\\\A.Owais khan\\\\Desktop\\\\GTVC Website\\\\offline Database Management System\\\\database","partition":"C:","success":true,"fileSizeMB":"0.026","fileName":"gtvc_db_backup_2026-10-23T23-54-58-573Z.sql"},{"locationId":1792797396868,"locationName":"Drive D Redundant Storage","path":"D:\\\\GTVC_Database_Backup","partition":"D:","success":true,"fileSizeMB":"0.026","fileName":"gtvc_db_backup_2026-10-23T23-54-58-573Z.sql"}]', 1, 'Administrator (Offline Demo)', 'Exported full database backup to 2 storage locations (gtvc_db_backup_2026-10-23T23-54-58-573Z.sql)', '2026-10-23 23:54:58'),
(10, 'database_backups', 2147483647, 'create', NULL, '[{"locationId":1,"locationName":"Default Project Database Folder","path":"C:\\\\Users\\\\A.Owais khan\\\\Desktop\\\\GTVC Website\\\\offline Database Management System\\\\database","partition":"C:","success":true,"fileSizeMB":"0.027","fileName":"gtvc_db_backup_2026-10-24T00-09-20-976Z.sql"},{"locationId":1792797396868,"locationName":"Drive D Redundant Storage","path":"D:\\\\GTVC_Database_Backup","partition":"D:","success":true,"fileSizeMB":"0.027","fileName":"gtvc_db_backup_2026-10-24T00-09-20-976Z.sql"}]', 1, 'Administrator (Offline Demo)', 'Exported full database backup to 2 storage locations (gtvc_db_backup_2026-10-24T00-09-20-976Z.sql)', '2026-10-24 00:09:20'),
(11, 'database_backups', 2147483647, 'create', NULL, '[{"locationId":1,"locationName":"Default Project Database Folder","path":"C:\\\\Users\\\\A.Owais khan\\\\Desktop\\\\GTVC Website\\\\offline Database Management System\\\\database","partition":"C:","success":true,"fileSizeMB":"0.027","fileName":"gtvc_db_backup_2026-10-24T00-09-51-680Z.sql"},{"locationId":1792797396868,"locationName":"Drive D Redundant Storage","path":"D:\\\\GTVC_Database_Backup","partition":"D:","success":true,"fileSizeMB":"0.027","fileName":"gtvc_db_backup_2026-10-24T00-09-51-680Z.sql"}]', 1, 'Administrator (Offline Demo)', 'Exported full database backup to 2 storage locations (gtvc_db_backup_2026-10-24T00-09-51-680Z.sql)', '2026-10-24 00:09:51'),
(12, 'storage_locations', 2147483647, 'create', NULL, '{"id":1792801001820,"name":"Test Drive D","path":"D:\\\\TestFolder","partition":"D:","isPrimary":false,"autoBackup":true,"lastBackupAt":null,"createdAt":"2026-10-24T00:16:41.820Z"}', 1, 'System Administrator', 'Added database storage folder location "D:\\TestFolder" on drive D:', '2026-10-24 00:16:41'),
(13, 'storage_locations', 4, 'create', NULL, '{"id":4,"name":"Test E Drive","path":"E:\\\\GTVC_Test","partition":"E:","isPrimary":false,"autoBackup":true,"lastBackupAt":null,"createdAt":"2026-10-24T00:28:31.505Z"}', 1, 'System Administrator', 'Added database storage folder location "E:\\GTVC_Test" on drive E:', '2026-10-24 00:28:31'),
(14, 'storage_locations', 4, 'delete', '{"id":4,"name":"Test E Drive","path":"E:\\\\GTVC_Test","partition":"E:","isPrimary":false,"autoBackup":true,"lastBackupAt":null,"createdAt":"2026-10-24T00:28:31.505Z"}', NULL, 1, 'System Administrator', 'Removed database storage location "Test E Drive" (E:\\GTVC_Test)', '2026-10-24 00:28:50'),
(15, 'students', 8, 'delete', '{"id":8,"student_id":"STU-2024-008","full_name":"Asad Iqbal","father_name":"Iqbal Hussain","cnic":"15402-8901234-5","date_of_birth":null,"gender":null,"phone":"0307-8889900","address":null,"district":null,"photo_path":null,"admission_date":"2024-09-14T19:00:00.000Z","status":"active","created_at":"2026-10-23T22:53:35.000Z","email":null,"applied_course_id":1,"applied_date":null,"degree_status":"enrolled","completion_date":null,"study_plan":null,"projects":null,"session_id":1}', NULL, 1, 'Administrator (Offline Demo)', 'Deleted student "Asad Iqbal"', '2026-10-24 20:12:45'),
(16, 'students', 8, 'restore', NULL, '{"id":8,"student_id":"STU-2024-008","full_name":"Asad Iqbal","father_name":"Iqbal Hussain","cnic":"15402-8901234-5","date_of_birth":null,"gender":null,"phone":"0307-8889900","address":null,"district":null,"photo_path":null,"admission_date":"2024-09-14T19:00:00.000Z","status":"active","created_at":"2026-10-23T22:53:35.000Z","email":null,"applied_course_id":1,"applied_date":null,"degree_status":"enrolled","completion_date":null,"study_plan":null,"projects":null,"session_id":1}', 1, 'Administrator (Offline Demo)', 'Restored students record "Asad Iqbal"', '2026-10-24 20:23:10'),
(17, 'users', 3, 'delete', '{"id":3,"username":"nomankhan","full_name":"mano khan","role":"teacher","email":"manokhankhan291@gmail.com","phone":"03271697695","is_active":1,"created_at":"2026-10-20T21:02:44.000Z","updated_at":"2026-10-20T21:02:44.000Z","employee_id":null,"cnic":null,"date_of_birth":null,"joining_date":null,"gender":null,"qualification":null,"specialization":null,"address":null}', NULL, 1, 'Administrator (Offline Demo)', 'Deleted user "mano khan" (nomankhan)', '2026-10-24 20:23:21'),
(18, 'users', 2, 'delete', '{"id":2,"username":"admin2","full_name":"Admin User","role":"admin","email":null,"phone":null,"is_active":1,"created_at":"2026-10-20T22:53:31.000Z","updated_at":"2026-10-20T22:53:31.000Z","employee_id":null,"cnic":null,"date_of_birth":null,"joining_date":null,"gender":null,"qualification":null,"specialization":null,"address":null}', NULL, 1, 'Administrator (Offline Demo)', 'Deleted user "Admin User" (admin2)', '2026-10-24 20:29:51'),
(19, 'database_backups', 2147483647, 'create', NULL, '[{"locationId":1,"locationName":"Default Project Database Folder","path":"C:\\\\Users\\\\A.Owais khan\\\\Desktop\\\\GTVC Website\\\\offline Database Management System\\\\database","partition":"C:","success":true,"fileSizeMB":"0.032","fileName":"gtvc_db_backup_2026-10-24T20-30-35-851Z.sql"},{"locationId":2,"locationName":"Drive D Redundant Storage","path":"D:\\\\GTVC_Database_Backup","partition":"D:","success":true,"fileSizeMB":"0.032","fileName":"gtvc_db_backup_2026-10-24T20-30-35-851Z.sql"},{"locationId":3,"locationName":"Test Drive D","path":"D:\\\\TestFolder","partition":"D:","success":true,"fileSizeMB":"0.032","fileName":"gtvc_db_backup_2026-10-24T20-30-35-851Z.sql"}]', 1, 'Administrator (Offline Demo)', 'Exported full database backup to 3 storage locations (gtvc_db_backup_2026-10-24T20-30-35-851Z.sql)', '2026-10-24 20:30:35'),
(20, 'academic_sessions', 4, 'update', '{"status":"upcoming"}', '{"status":"completed"}', 1, 'Administrator (Offline Demo)', 'Changed session "Session 2025-2026 (Upcoming)" status to completed', '2026-10-24 20:42:54'),
(21, 'academic_sessions', 4, 'update', '{"status":"completed"}', '{"status":"active"}', 1, 'Administrator (Offline Demo)', 'Changed session "Session 2025-2026 (Upcoming)" status to active', '2026-10-24 20:42:57'),
(22, 'academic_sessions', 4, 'update', '{"status":"active"}', '{"status":"completed"}', 1, 'Administrator (Offline Demo)', 'Changed session "Session 2025-2026 (Upcoming)" status to completed', '2026-10-24 20:42:58'),
(23, 'academic_sessions', 4, 'update', '{"status":"completed"}', '{"status":"active"}', 1, 'Administrator (Offline Demo)', 'Changed session "Session 2025-2026 (Upcoming)" status to active', '2026-10-24 20:43:01'),
(24, 'academic_sessions', 4, 'update', '{"status":"active"}', '{"status":"completed"}', 1, 'Administrator (Offline Demo)', 'Changed session "Session 2025-2026 (Upcoming)" status to completed', '2026-10-24 20:43:07'),
(25, 'academic_sessions', 4, 'update', '{"status":"completed"}', '{"status":"active"}', 1, 'Administrator (Offline Demo)', 'Changed session "Session 2025-2026 (Upcoming)" status to active', '2026-10-24 20:43:08'),
(26, 'academic_sessions', 2, 'delete', '{"id":2,"session_name":"Session 2023-2024 (Annual)","session_code":"SESS-2023-24","start_date":"2023-08-31T19:00:00.000Z","end_date":"2024-08-30T19:00:00.000Z","status":"completed","total_admissions":142,"description":"Completed academic session. All board exams finished, diplomas verified.","created_at":"2026-10-23T22:53:35.000Z","updated_at":"2026-10-23T22:53:35.000Z"}', NULL, 1, 'Administrator (Offline Demo)', 'Deleted session "Session 2023-2024 (Annual)"', '2026-10-24 20:44:11'),
(27, 'academic_sessions', 3, 'delete', '{"id":3,"session_name":"Session 2022-2023 (Annual)","session_code":"SESS-2022-23","start_date":"2022-08-31T19:00:00.000Z","end_date":"2023-08-30T19:00:00.000Z","status":"completed","total_admissions":126,"description":"Past completed session. Certificates awarded.","created_at":"2026-10-23T22:53:35.000Z","updated_at":"2026-10-23T22:53:35.000Z"}', NULL, 1, 'Administrator (Offline Demo)', 'Deleted session "Session 2022-2023 (Annual)"', '2026-10-24 20:44:13'),
(28, 'users', 4, 'delete', '{"id":4,"username":"principal","full_name":"Dr. Faraz Uddin","role":"principal","email":"principal@gtvc.edu.pk","phone":"0301-1111111","is_active":1,"created_at":"2026-10-24T21:58:58.000Z","updated_at":"2026-10-24T21:58:58.000Z","employee_id":"GTVC-P-001","cnic":"17403-1111111-1","date_of_birth":"1980-01-14T19:00:00.000Z","joining_date":"2017-12-31T19:00:00.000Z","gender":"male","qualification":"PhD Computer Science","specialization":null,"address":null}', NULL, 1, 'Administrator (Offline Demo)', 'Deleted user "Dr. Faraz Uddin" (principal)', '2026-10-24 22:08:03');

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
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `enrollments` (19 records)
INSERT INTO `enrollments` (`id`, `student_id`, `class_id`, `roll_number`, `enrolled_at`) VALUES
(1, 1, 1, 'STU-2024-001', '2026-10-24 22:02:39'),
(2, 2, 1, 'STU-2024-002', '2026-10-24 22:02:39'),
(3, 3, 1, 'STU-2024-003', '2026-10-24 22:02:39'),
(4, 4, 2, 'STU-2024-004', '2026-10-24 22:02:39'),
(5, 5, 2, 'STU-2024-005', '2026-10-24 22:02:39'),
(6, 6, 3, 'STU-2024-006', '2026-10-24 22:02:39'),
(7, 7, 3, 'STU-2024-007', '2026-10-24 22:02:39'),
(8, 11, 2, 'CCVT-2026-004', '2026-10-24 22:02:39'),
(9, 12, 2, 'CCVT-2026-003', '2026-10-24 22:02:39'),
(10, 13, 2, 'CCVT-2026-002', '2026-10-24 22:02:39'),
(11, 14, 2, 'CCVT-2026-001', '2026-10-24 22:02:39'),
(12, 15, 1, 'DIT-2026-004', '2026-10-24 22:02:39'),
(13, 16, 1, 'DIT-2026-003', '2026-10-24 22:02:39'),
(14, 17, 1, 'DIT-2026-002', '2026-10-24 22:02:39'),
(15, 18, 1, 'DIT-2026-001', '2026-10-24 22:02:39'),
(16, 19, 3, 'GIT-2026-004', '2026-10-24 22:02:39'),
(17, 20, 3, 'GIT-2026-003', '2026-10-24 22:02:39'),
(18, 21, 3, 'GIT-2026-002', '2026-10-24 22:02:39'),
(19, 22, 3, 'GIT-2026-001', '2026-10-24 22:02:39');

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `notices` (3 records)
INSERT INTO `notices` (`id`, `title`, `content`, `posted_by`, `target_role`, `file_path`, `is_active`, `created_at`) VALUES
(1, 'Mid-Term Exams Schedule', 'Mid-term examinations for all trades will begin 15 November 2026. Allocations of dates will be shared by the section in-charge.', 1, 'all', NULL, 1, '2026-10-24 22:02:39'),
(2, 'Holiday Notice', 'The center will remain closed on 06 October 2026 on account of Prophet Muhammad (PBUH) birthday.', 1, 'all', NULL, 1, '2026-10-24 22:02:39'),
(3, 'New Batches Opening', 'Admissions are open for the January 2027 batches in DIT, CCVT and GIT. Submit enrollment requests to the front desk.', 1, 'teacher', NULL, 1, '2026-10-24 22:02:39');

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `recycle_bin` (5 records)
INSERT INTO `recycle_bin` (`id`, `original_table`, `original_id`, `record_data`, `deleted_by`, `deleted_by_name`, `deleted_at`) VALUES
(2, 'users', 3, '{"id":3,"username":"nomankhan","full_name":"mano khan","role":"teacher","email":"manokhankhan291@gmail.com","phone":"03271697695","is_active":1,"created_at":"2026-10-20T21:02:44.000Z","updated_at":"2026-10-20T21:02:44.000Z","employee_id":null,"cnic":null,"date_of_birth":null,"joining_date":null,"gender":null,"qualification":null,"specialization":null,"address":null}', 1, 'Administrator (Offline Demo)', '2026-10-24 20:23:21'),
(3, 'users', 2, '{"id":2,"username":"admin2","full_name":"Admin User","role":"admin","email":null,"phone":null,"is_active":1,"created_at":"2026-10-20T22:53:31.000Z","updated_at":"2026-10-20T22:53:31.000Z","employee_id":null,"cnic":null,"date_of_birth":null,"joining_date":null,"gender":null,"qualification":null,"specialization":null,"address":null}', 1, 'Administrator (Offline Demo)', '2026-10-24 20:29:51'),
(4, 'academic_sessions', 2, '{"id":2,"session_name":"Session 2023-2024 (Annual)","session_code":"SESS-2023-24","start_date":"2023-08-31T19:00:00.000Z","end_date":"2024-08-30T19:00:00.000Z","status":"completed","total_admissions":142,"description":"Completed academic session. All board exams finished, diplomas verified.","created_at":"2026-10-23T22:53:35.000Z","updated_at":"2026-10-23T22:53:35.000Z"}', 1, 'Administrator (Offline Demo)', '2026-10-24 20:44:11'),
(5, 'academic_sessions', 3, '{"id":3,"session_name":"Session 2022-2023 (Annual)","session_code":"SESS-2022-23","start_date":"2022-08-31T19:00:00.000Z","end_date":"2023-08-30T19:00:00.000Z","status":"completed","total_admissions":126,"description":"Past completed session. Certificates awarded.","created_at":"2026-10-23T22:53:35.000Z","updated_at":"2026-10-23T22:53:35.000Z"}', 1, 'Administrator (Offline Demo)', '2026-10-24 20:44:13'),
(6, 'users', 4, '{"id":4,"username":"principal","full_name":"Dr. Faraz Uddin","role":"principal","email":"principal@gtvc.edu.pk","phone":"0301-1111111","is_active":1,"created_at":"2026-10-24T21:58:58.000Z","updated_at":"2026-10-24T21:58:58.000Z","employee_id":"GTVC-P-001","cnic":"17403-1111111-1","date_of_birth":"1980-01-14T19:00:00.000Z","joining_date":"2017-12-31T19:00:00.000Z","gender":"male","qualification":"PhD Computer Science","specialization":null,"address":null}', 1, 'Administrator (Offline Demo)', '2026-10-24 22:08:03');

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
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `results` (119 records)
INSERT INTO `results` (`id`, `student_id`, `class_id`, `subject_id`, `exam_type`, `marks_obtained`, `total_marks`, `grade`, `entered_by`, `exam_date`, `created_at`) VALUES
(1, 1, 1, 1, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(2, 1, 1, 2, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(3, 1, 1, 3, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(4, 1, 1, 4, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(5, 1, 1, 5, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(6, 2, 1, 1, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(7, 2, 1, 2, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(8, 2, 1, 3, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(9, 2, 1, 4, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(10, 2, 1, 5, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(11, 3, 1, 1, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(12, 3, 1, 2, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(13, 3, 1, 3, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(14, 3, 1, 4, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(15, 3, 1, 5, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(16, 15, 1, 1, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(17, 15, 1, 2, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(18, 15, 1, 3, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(19, 15, 1, 4, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(20, 15, 1, 5, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(21, 16, 1, 1, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(22, 16, 1, 2, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(23, 16, 1, 3, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(24, 16, 1, 4, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(25, 16, 1, 5, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(26, 17, 1, 1, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(27, 17, 1, 2, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(28, 17, 1, 3, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(29, 17, 1, 4, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(30, 17, 1, 5, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(31, 18, 1, 1, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(32, 18, 1, 2, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(33, 18, 1, 3, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(34, 18, 1, 4, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(35, 18, 1, 5, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(36, 4, 2, 6, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(37, 4, 2, 7, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(38, 4, 2, 8, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(39, 4, 2, 9, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(40, 4, 2, 19, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(41, 4, 2, 20, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(42, 4, 2, 21, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(43, 5, 2, 6, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(44, 5, 2, 7, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(45, 5, 2, 8, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(46, 5, 2, 9, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(47, 5, 2, 19, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(48, 5, 2, 20, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(49, 5, 2, 21, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(50, 11, 2, 6, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(51, 11, 2, 7, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(52, 11, 2, 8, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(53, 11, 2, 9, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(54, 11, 2, 19, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(55, 11, 2, 20, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(56, 11, 2, 21, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(57, 12, 2, 6, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(58, 12, 2, 7, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(59, 12, 2, 8, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(60, 12, 2, 9, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(61, 12, 2, 19, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(62, 12, 2, 20, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(63, 12, 2, 21, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(64, 13, 2, 6, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(65, 13, 2, 7, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(66, 13, 2, 8, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(67, 13, 2, 9, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(68, 13, 2, 19, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(69, 13, 2, 20, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(70, 13, 2, 21, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(71, 14, 2, 6, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(72, 14, 2, 7, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(73, 14, 2, 8, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(74, 14, 2, 9, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(75, 14, 2, 19, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(76, 14, 2, 20, 'monthly', '71.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(77, 14, 2, 21, 'monthly', '79.00', '100.00', 'A', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(78, 6, 3, 10, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(79, 6, 3, 11, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(80, 6, 3, 12, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(81, 6, 3, 13, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(82, 6, 3, 22, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(83, 6, 3, 23, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(84, 6, 3, 24, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(85, 7, 3, 10, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(86, 7, 3, 11, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(87, 7, 3, 12, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(88, 7, 3, 13, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(89, 7, 3, 22, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(90, 7, 3, 23, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(91, 7, 3, 24, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(92, 19, 3, 10, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(93, 19, 3, 11, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(94, 19, 3, 12, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(95, 19, 3, 13, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(96, 19, 3, 22, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(97, 19, 3, 23, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(98, 19, 3, 24, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(99, 20, 3, 10, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(100, 20, 3, 11, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39');

INSERT INTO `results` (`id`, `student_id`, `class_id`, `subject_id`, `exam_type`, `marks_obtained`, `total_marks`, `grade`, `entered_by`, `exam_date`, `created_at`) VALUES
(101, 20, 3, 12, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(102, 20, 3, 13, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(103, 20, 3, 22, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(104, 20, 3, 23, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(105, 20, 3, 24, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(106, 21, 3, 10, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(107, 21, 3, 11, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(108, 21, 3, 12, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(109, 21, 3, 13, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(110, 21, 3, 22, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(111, 21, 3, 23, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(112, 21, 3, 24, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(113, 22, 3, 10, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(114, 22, 3, 11, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(115, 22, 3, 12, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(116, 22, 3, 13, 'monthly', '63.00', '100.00', 'B', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(117, 22, 3, 22, 'monthly', '87.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(118, 22, 3, 23, 'monthly', '95.00', '100.00', 'A-1', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39'),
(119, 22, 3, 24, 'monthly', '55.00', '100.00', 'C', 1, '2026-09-29 19:00:00', '2026-10-24 22:02:39');

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
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `students` (21 records)
INSERT INTO `students` (`id`, `student_id`, `full_name`, `father_name`, `cnic`, `date_of_birth`, `gender`, `phone`, `address`, `district`, `photo_path`, `admission_date`, `status`, `created_at`, `email`, `applied_course_id`, `applied_date`, `degree_status`, `completion_date`, `study_plan`, `projects`, `session_id`) VALUES
(1, 'STU-2024-001', 'Muhammad Usman Khan', 'Tariq Khan', '15402-1234567-1', NULL, NULL, '0300-1112233', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 8, NULL, 'enrolled', NULL, NULL, NULL, 1),
(2, 'STU-2024-002', 'Ahmad Bilal', 'Muhammad Zahir', '15402-2345678-3', NULL, NULL, '0301-2223344', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 8, NULL, 'enrolled', NULL, NULL, NULL, 1),
(3, 'STU-2024-003', 'Sohail Ahmad', 'Bakhtiar Ahmad', '15402-3456789-5', NULL, NULL, '0302-3334455', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 8, NULL, 'enrolled', NULL, NULL, NULL, 1),
(4, 'STU-2024-004', 'Hamza Farooq', 'Farooq Shah', '15402-4567890-7', NULL, NULL, '0303-4445566', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 9, NULL, 'enrolled', NULL, NULL, NULL, 1),
(5, 'STU-2024-005', 'Zia Ullah', 'Inayat Ullah', '15402-5678901-9', NULL, NULL, '0304-5556677', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 9, NULL, 'enrolled', NULL, NULL, NULL, 1),
(6, 'STU-2024-006', 'Kamran Ali', 'Sher Ali', '15402-6789012-1', NULL, NULL, '0305-6667788', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 10, NULL, 'enrolled', NULL, NULL, NULL, 1),
(7, 'STU-2024-007', 'Noman Khan', 'Said Rahman', '15402-7890123-3', NULL, NULL, '0306-7778899', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 10, NULL, 'enrolled', NULL, NULL, NULL, 1),
(9, 'STU-2024-009', 'Rashid Mehmood', 'Mehmood Jan', '15402-9012345-7', NULL, NULL, '0308-9990011', NULL, NULL, NULL, '2024-09-14 19:00:00', 'active', '2026-10-23 22:53:35', NULL, 3, NULL, 'enrolled', NULL, NULL, NULL, 1),
(10, 'STU-2024-008', 'Asad Iqbal', 'Iqbal Hussain', '15402-8901234-5', NULL, NULL, '0307-8889900', NULL, NULL, NULL, '2024-09-13 19:00:00', 'active', '2026-10-23 17:53:35', NULL, 1, NULL, 'enrolled', NULL, NULL, NULL, 1),
(11, 'CCVT-2026-004', 'Sahar Gul', 'Alam Gul', '17403-7000008-8', '2003-02-13 19:00:00', 'female', '0318-7000008', NULL, 'Dargai', NULL, '2026-01-31 19:00:00', 'active', '2026-10-24 22:02:39', NULL, 9, NULL, 'enrolled', NULL, NULL, NULL, 5),
(12, 'CCVT-2026-003', 'Ayesha Bibi', 'Muhammad Nawaz', '17403-7000007-7', '2004-08-08 19:00:00', 'female', '0317-7000007', NULL, 'Dargai', NULL, '2026-01-31 19:00:00', 'active', '2026-10-24 22:02:39', NULL, 9, NULL, 'enrolled', NULL, NULL, NULL, 5),
(13, 'CCVT-2026-002', 'Usman Ghani', 'Ghaniullah Khan', '17403-7000006-6', '2002-03-24 19:00:00', 'male', '0316-7000006', NULL, 'Dargai', NULL, '2026-01-31 19:00:00', 'active', '2026-10-24 22:02:39', NULL, 9, NULL, 'enrolled', NULL, NULL, NULL, 5),
(14, 'CCVT-2026-001', 'Bilal Ahmed', 'Sahib Ahmed', '17403-7000005-5', '2001-06-17 19:00:00', 'male', '0315-7000005', NULL, 'Dargai', NULL, '2026-01-31 19:00:00', 'active', '2026-10-24 22:02:39', NULL, 9, NULL, 'enrolled', NULL, NULL, NULL, 5),
(15, 'DIT-2026-004', 'Hira Noor', 'Abdul Noor', '17403-7000004-4', '2003-11-10 19:00:00', 'female', '0314-7000004', NULL, 'Dargai', NULL, '2026-01-14 19:00:00', 'active', '2026-10-24 22:02:39', NULL, 8, NULL, 'enrolled', NULL, NULL, NULL, 5),
(16, 'DIT-2026-003', 'Zubair Khan', 'Noor Mohammad', '17403-7000003-3', '2004-01-19 19:00:00', 'male', '0313-7000003', NULL, 'Dargai', NULL, '2026-01-14 19:00:00', 'active', '2026-10-24 22:02:39', NULL, 8, NULL, 'enrolled', NULL, NULL, NULL, 5),
(17, 'DIT-2026-002', 'Shahzaib Ali', 'Muhammad Ali', '17403-7000002-2', '2002-09-02 18:00:00', 'male', '0312-7000002', NULL, 'Dargai', NULL, '2026-01-14 19:00:00', 'active', '2026-10-24 22:02:39', NULL, 8, NULL, 'enrolled', NULL, NULL, NULL, 5),
(18, 'DIT-2026-001', 'Imran Khan', 'Sher Mohammad Khan', '17403-7000001-1', '2003-05-11 19:00:00', 'male', '0311-7000001', NULL, 'Dargai', NULL, '2026-01-14 19:00:00', 'active', '2026-10-24 22:02:39', NULL, 8, NULL, 'enrolled', NULL, NULL, NULL, 5),
(19, 'GIT-2026-004', 'Daniyal Aziz', 'Abdul Aziz', '17403-7000012-2', '2002-10-15 19:00:00', 'male', '0322-7000012', NULL, 'Dargai', NULL, '2026-02-14 19:00:00', 'active', '2026-10-24 22:02:39', NULL, 10, NULL, 'enrolled', NULL, NULL, NULL, 5),
(20, 'GIT-2026-003', 'Fatima Noor', 'Noor-ul-Amin', '17403-7000011-1', '2003-04-29 19:00:00', 'female', '0321-7000011', NULL, 'Dargai', NULL, '2026-02-14 19:00:00', 'active', '2026-10-24 22:02:39', NULL, 10, NULL, 'enrolled', NULL, NULL, NULL, 5),
(21, 'GIT-2026-002', 'Adnan Yousaf', 'Yousaf Ali', '17403-7000010-0', '2001-07-06 19:00:00', 'male', '0320-7000010', NULL, 'Dargai', NULL, '2026-02-14 19:00:00', 'active', '2026-10-24 22:02:39', NULL, 10, NULL, 'enrolled', NULL, NULL, NULL, 5),
(22, 'GIT-2026-001', 'Hamza Khan', 'Aslam Khan', '17403-7000009-9', '2000-11-30 19:00:00', 'male', '0319-7000009', NULL, 'Dargai', NULL, '2026-02-14 19:00:00', 'active', '2026-10-24 22:02:39', NULL, 10, NULL, 'enrolled', NULL, NULL, NULL, 5);

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
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `subjects` (24 records)
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
(18, 'Typing & Office Documentation', 3, 100, 40, NULL, 'COM-102'),
(19, 'Video Editing Basics', 9, 100, 40, 5, 'CCVT-203'),
(20, 'Graphics Design', 9, 100, 40, 5, 'CCVT-202'),
(21, 'MS Office & Typing', 9, 100, 40, 5, 'CCVT-201'),
(22, 'Computer Hardware', 10, 100, 40, 5, 'GIT-303'),
(23, 'HTML/CSS & JavaScript', 10, 100, 40, 5, 'GIT-302'),
(24, 'Database Management', 10, 100, 40, 5, 'GIT-301');

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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `teachers` (4 records)
INSERT INTO `teachers` (`id`, `user_id`, `employee_id`, `cnic`, `date_of_birth`, `gender`, `qualification`, `specialization`, `joining_date`, `address`, `photo_path`, `is_active`, `created_at`) VALUES
(1, 5, 'GTVC-T-001', '17403-2222222-2', '1990-03-09 19:00:00', 'male', 'BS Computer Science', 'Networking (DIT)', '2020-08-31 19:00:00', 'Dargai, Malakand', NULL, 1, '2026-10-24 22:02:39'),
(2, 6, 'GTVC-T-002', '17403-3333333-3', '1988-07-21 19:00:00', 'male', 'DACS', 'Office Automation (CCVT)', '2021-01-14 19:00:00', 'Dargai, Malakand', NULL, 1, '2026-10-24 22:02:39'),
(3, 7, 'GTVC-T-003', '17403-4444444-4', '1993-11-04 19:00:00', 'female', 'BS Information Technology', 'Web Development (GIT)', '2022-02-28 19:00:00', 'Dargai, Malakand', NULL, 1, '2026-10-24 22:02:39'),
(4, 8, 'GTVC-T-004', '17403-5555555-5', '1991-05-29 19:00:00', 'male', 'ADCS', 'Hardware & Networking', '2023-08-14 19:00:00', 'Dargai, Malakand', NULL, 1, '2026-10-24 22:02:39');

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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `user_activity_timeline` (20 records)
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
(10, 1, 'admin', 'System Administrator', 'admin', '2026-10-23 23:17:35', '2026-10-23 23:21:36', 4, '::1', 'Browser', 'logged_out', '2026-10-23 23:17:35'),
(11, 1, 'admin', 'System Administrator', 'admin', '2026-10-24 00:16:41', '2026-10-24 00:18:07', 1, '::1', 'node', 'logged_out', '2026-10-24 00:16:41'),
(12, 1, 'admin', 'System Administrator', 'admin', '2026-10-24 00:28:31', '2026-10-24 00:29:50', 1, '::1', 'Browser', 'logged_out', '2026-10-24 00:28:31'),
(13, 1, 'admin', 'System Administrator', 'admin', '2026-10-24 00:28:50', '2026-10-24 00:29:45', 0, '::1', 'Browser', 'logged_out', '2026-10-24 00:28:50'),
(14, 1, 'admin', 'System Administrator', 'admin', '2026-10-24 21:41:16', '2026-10-24 21:53:51', 12, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9711', 'logged_out', '2026-10-24 21:41:16'),
(15, 1, 'admin', 'System Administrator', 'admin', '2026-10-24 21:41:26', '2026-10-24 21:47:48', 6, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9711', 'logged_out', '2026-10-24 21:41:26'),
(16, 7, 'miss_sara', 'Sara Gul', 'teacher', '2026-10-24 21:59:05', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9711', 'active', '2026-10-24 21:59:05'),
(17, 1, 'admin', 'System Administrator', 'admin', '2026-10-24 22:17:06', '2026-10-24 22:29:12', 12, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9711', 'logged_out', '2026-10-24 22:17:06'),
(18, 1, 'admin', 'System Administrator', 'admin', '2026-10-24 22:17:57', '2026-10-24 22:29:06', 11, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9711', 'logged_out', '2026-10-24 22:17:57'),
(19, 1, 'admin', 'System Administrator', 'admin', '2026-10-24 22:18:29', '2026-10-24 22:29:00', 10, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9711', 'logged_out', '2026-10-24 22:18:29'),
(20, 1, 'admin', 'System Administrator', 'admin', '2026-10-24 22:39:11', NULL, NULL, '::1', 'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.26100.9711', 'active', '2026-10-24 22:39:11');

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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `users` (5 records)
INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `role`, `email`, `phone`, `is_active`, `created_at`, `updated_at`, `employee_id`, `cnic`, `date_of_birth`, `joining_date`, `gender`, `qualification`, `specialization`, `address`) VALUES
(1, 'admin', '$2a$10$oMvNFpdquxq.wVgg1MT/G.fZJaz2E9pCSMT53WkYPi3ujbmsy6Mwi', 'System Administrator', 'admin', NULL, '0300-0000000', 1, '2026-10-20 22:02:40', '2026-10-21 02:33:24', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'sir_rehman', '$2a$10$3MdSiG6AnO0cEb9XKoOZnOD4cSfujvGfi6629Z8jF1FqM3KlHUO9u', 'Abdur Rehman Khan', 'teacher', 'rehman@gtvc.edu.pk', '0302-2222222', 1, '2026-10-24 21:58:58', '2026-10-24 22:16:52', 'GTVC-T-001', '17403-2222222-2', '1990-03-09 19:00:00', '2020-08-31 19:00:00', 'male', 'BS Computer Science', 'Networking (DIT)', 'Dargai, Malakand'),
(6, 'sir_basir', '$2a$10$3MdSiG6AnO0cEb9XKoOZnOD4cSfujvGfi6629Z8jF1FqM3KlHUO9u', 'Basir Ullah', 'teacher', 'basir@gtvc.edu.pk', '0303-3333333', 1, '2026-10-24 21:58:58', '2026-10-24 22:16:52', 'GTVC-T-002', '17403-3333333-3', '1988-07-21 19:00:00', '2021-01-14 19:00:00', 'male', 'DACS', 'Office Automation (CCVT)', 'Dargai, Malakand'),
(7, 'miss_sara', '$2a$10$3MdSiG6AnO0cEb9XKoOZnOD4cSfujvGfi6629Z8jF1FqM3KlHUO9u', 'Sara Gul', 'teacher', 'sara@gtvc.edu.pk', '0304-4444444', 1, '2026-10-24 21:58:58', '2026-10-24 22:16:52', 'GTVC-T-003', '17403-4444444-4', '1993-11-04 19:00:00', '2022-02-28 19:00:00', 'female', 'BS Information Technology', 'Web Development (GIT)', 'Dargai, Malakand'),
(8, 'sir_waqas', '$2a$10$3MdSiG6AnO0cEb9XKoOZnOD4cSfujvGfi6629Z8jF1FqM3KlHUO9u', 'Waqas Ahmed', 'teacher', 'waqas@gtvc.edu.pk', '0305-5555555', 1, '2026-10-24 21:58:58', '2026-10-24 22:16:52', 'GTVC-T-004', '17403-5555555-5', '1991-05-29 19:00:00', '2023-08-14 19:00:00', 'male', 'ADCS', 'Hardware Repair', 'Dargai, Malakand');

SET FOREIGN_KEY_CHECKS = 1;
