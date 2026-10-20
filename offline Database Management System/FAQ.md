# ❓ Frequently Asked Questions (FAQ)
## GTVC Dargai — Offline Database Management System

This document contains answers to important questions regarding running the system, database management, folder locations, XAMPP, VS Code extensions, and data migration.

---

### 1. Can I use this website and database without XAMPP Control Panel?
**YES, 100%!**
- **For the Website & Web Server (Node.js):**
  - Node.js has its own built-in web server (Express). You do **not** need Apache or XAMPP to host or view the website.
- **For the Database (MySQL):**
  - If you have standalone **MySQL Community Server** installed on Windows, it runs automatically in the background as a Windows Service. You do not need any control panel to be open.
  - If you happen to have XAMPP installed, you can simply click **"Start"** on MySQL only (Apache is not needed).

---

### 2. Can I store, use, and run this website in ANY folder outside `htdocs`?
**YES, in ANY folder or drive you want!**
- The `C:\xampp\htdocs\` folder is only required for PHP projects running on Apache.
- This project is powered by **Node.js**:
  - You can store it on your **Desktop** (`C:\Users\A.Owais khan\Desktop\...`), on **Drive D:** (`D:\GTVC System\`), in **Documents**, or on a **USB Flash Drive**.
  - Node.js connects to MySQL over port `3306` from wherever the project is saved.
  - To start the server, open a terminal in your project folder and run:
    ```bash
    node server.js
    ```
  - Open your browser to: `http://localhost:3000`

---

### 3. Can I run MySQL without XAMPP?
**YES, absolutely!**
- MySQL is an independent software created by Oracle; XAMPP is just a third-party bundle.
- You can install the official **MySQL Community Server** from [dev.mysql.com/downloads/installer/](https://dev.mysql.com/downloads/installer/).
- When installed as a Windows Service:
  - MySQL starts automatically whenever Windows boots up.
  - It runs quietly in the background without needing any control panel.

---

### 4. How do I use the VS Code "MySQL" Extension as my Database GUI?
You can manage and view your database directly inside VS Code without needing phpMyAdmin or external tools:

1. **Install the Extension:**
   - In VS Code, open the Extensions tab (`Ctrl + Shift + X`).
   - Search for **MySQL** (by *Weijan Chen* / *cweijan*) and click **Install**.
2. **Connect to your Database:**
   - Click the Database icon in the VS Code sidebar.
   - Click **Add Connection (+)** and enter:
     - **Host:** `localhost` (or `127.0.0.1`)
     - **Port:** `3306`
     - **Username:** `root`
     - **Password:** *(leave blank if default, or enter your MySQL root password)*
     - **Database:** `gtvc_db`
   - Click **Connect**.
3. **Run your Schema & Seed Data (`gtvc_db.sql`):**
   - Open [database/gtvc_db.sql](file:///c:/Users/A.Owais%20khan/Desktop/GTVC%20Website/offline%20Database%20Management%20System/database/gtvc_db.sql) in VS Code.
   - Right-click anywhere in the file and select **Run SQL** (or `Run Selected SQL`).
   - All 10 tables and initial seed data will be created in your MySQL database instantly!

---

### 5. If I install XAMPP, will my database or project files be deleted?
**NO, your files and database will NEVER be deleted!**
- Your SQL structure file (`database/gtvc_db.sql`) and all code are safely located in your project folder. Installing XAMPP will never touch or remove them.
- XAMPP installs cleanly into `C:\xampp`.
- If you install XAMPP, you can use its MySQL service or phpMyAdmin without affecting any files in this project.

---

### 6. Can I migrate and shift my website, database, and all data from one PC to another PC?
**YES, 100%! It takes only 3 simple steps:**

#### Step 1: Copy Website Files & Photos
- Copy the entire project folder `offline Database Management System/` to a **USB Flash Drive**.
- Paste it onto the new computer.
- This moves all code, HTML pages, and all student/teacher uploaded photos (`uploads/` folder).

#### Step 2: Move the Database
- **On the Old PC:**
  - In VS Code MySQL Extension: Right-click database `gtvc_db` ➔ Select **Export Database** (dumps to a `.sql` file).
  - Save that `.sql` file on your USB drive.
- **On the New PC:**
  - In VS Code MySQL Extension (or MySQL command line): Create database `gtvc_db` and import/run that `.sql` file.
  - All users, students, teachers, attendance, marks, and notices are restored 100%!

#### Step 3: Run on the New PC
- Make sure **Node.js** and **MySQL** are installed on the new PC.
- Open terminal in the project folder and run:
  ```bash
  npm install
  node server.js
  ```
- Open browser at `http://localhost:3000`.

---

*Document: GTVC Dargai FAQ*  
*College: Government Technical and Vocational Centre Dargai, Malakand*  
*Website: https://gtvcdargai.edu.pk*
