# Student Guide: How to Update & Maintain Your GTVC Website

As a student of GTVC, you can easily maintain, update, and customize every part of this website. Here is a guide on where and how to edit content.

---

## 1. Updating the Admission Session / Announcement Bar
When a new admission session opens (for example, Spring or Fall):
- Open `index.html`, `admissions.html`, `about.html`, `programs.html`, etc.
- Search for `ADMISSION OPEN NOW SESSION SPRING 2026`
- Change the text to your new session:
  ```html
  <span>ADMISSION OPEN NOW SESSION FALL 2026 &bull; DIT, CBT Level II & III Courses &bull; Apply Today!</span>
  ```

---

## 2. Adding or Editing a Course / Trade
To edit or add course information:
1. Open `programs.html`
2. Scroll to `<div class="course-detail-card" id="your-trade">`
3. You can edit:
   - **Course Title**: `<h2>`
   - **Description**: `<p>`
   - **Duration & Eligibility**: In the `.program-specs-grid` block
   - **Modules**: Inside `<ul class="syllabus-list">`
4. Also update the JSON file at `assets/data/programs.json` so you have clean data records.

---

## 3. Posting a New News Item or Notification
To post a new notice (e.g. holiday notice, test schedule, exam date sheet):
1. Open `news-events.html`
2. Duplicate one of the `<article class="news-detail-row">` blocks.
3. Update:
   - The badge: `<span class="badge-tag">Your Category</span>`
   - The date: `<span style="font-size: 0.85rem;"><i class="far fa-calendar-alt"></i> Date</span>`
   - The title: `<h2>Your Notice Title</h2>`
   - The description: `<p>Your announcement description</p>`
   - If there is a file or link: Add `<a href="your-link-or-file.pdf" class="btn-primary">Download Notice</a>`

---

## 4. Adding New Workshop or Event Photos
To add new photos to the gallery:
1. Place your new photo inside `assets/images/`
2. Open `gallery.html`
3. Add a new item inside `<div class="gallery-grid-full">`:
   ```html
   <div class="gallery-thumb-item" data-category="electrician" data-caption="New Solar Inverter Testing Session">
     <img src="assets/images/your-new-photo.jpg" alt="Solar Testing" class="gallery-thumb-img">
     <div class="gallery-thumb-overlay"><i class="fas fa-search-plus"></i></div>
   </div>
   ```
   *Tip: Use `data-category="electrician"`, `"plumbing"`, `"welding"`, `"it"`, or `"events"` to make the category filter buttons work automatically.*

---

## 5. Changing Contact Numbers, Email or Address
If phone numbers or email addresses change:
- Search across the project for `0932 331 966` and replace it with the new telephone.
- Search for `info@gtvcdargai.edu.pk` and replace it with the new official email.

---

## 6. How to Deploy to Free Hosting (GitHub Pages / Vercel / Netlify)
Since this project uses pure HTML, CSS, and JavaScript:
1. **GitHub Pages**:
   - Push this folder to a GitHub repository.
   - Go to **Settings > Pages > Branch: main / root** and click Save.
   - Your site will be live instantly with a free `.github.io` URL!
2. **Netlify / Vercel**:
   - Drag and drop this folder directly into [Netlify Drop](https://app.netlify.com/drop) or Vercel for instant deployment with SSL certificate.
