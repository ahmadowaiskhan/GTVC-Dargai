# Government Technical & Vocational Centre (GTVC) Dargai — Official Portal Clone & Redesign

Welcome to the modernized web project for **Government Technical & Vocational Centre (GTVC) Dargai, Malakand**, accredited by **NAVTTC** under the **Khyber Pakhtunkhwa Technical Education & Vocational Training Authority (KP-TEVTA)**.

---

## 📁 Project Structure & Organization

```
GTVC Website/
│
├── index.html                   # Modernized, responsive Homepage
├── about.html                   # Institutional history, KP-TEVTA, Principal message, Vision & Mission
├── programs.html                # Full course catalog: Electrician, Plumbing, Welding, Computer, AutoCAD, DIT
├── admissions.html              # Online admission registration form, criteria & required documents
├── faculty.html                 # Administration, instructors, and IT mentors
├── news-events.html             # Notifications, KP-TEVTA visits, KPBTE DIT examination results
├── gallery.html                 # Interactive workshop & campus photo gallery with category filter
├── downloads.html               # Printable admission form, prospectus, syllabus matrix
├── contact.html                 # Contact details, telephone, email, inquiry form, and Google Map
│
├── assets/
│   ├── css/
│   │   ├── style.css            # Master stylesheet (variables, fonts, cards, shadows, navbar)
│   │   └── responsive.css       # Mobile & tablet responsive breakpoints
│   ├── js/
│   │   ├── main.js              # Hero carousel, mobile navigation, counter animations, sticky header
│   │   └── gallery.js           # Lightbox modal for enlarged photo preview
│   ├── images/                  # All 50+ original logos, workshop photos, staff, and event pictures
│   └── data/
│       ├── programs.json        # Structured courses data
│       └── news.json            # Structured news & events data
│
├── docs/
│   └── HOW_TO_UPDATE.md         # Step-by-step student tutorial on editing text, images, and courses
│
└── tools/
    └── scraper-cache/           # Original downloaded HTML, mapping, and backup scripts
```

---

## 🚀 Key Features

1. **Complete Cloned Content**: Preserved 100% of authentic content from `gtvcdargai.edu.pk` including:
   - Official logos of GTVC and KP-TEVTA
   - Real workshop photos (Electrician, Plumbing, Welding, Computer, CAD)
   - Official contact details (`0932 331 966`, `info@gtvcdargai.edu.pk`)
   - 80% Practical / 20% Theory training policy
   - Genuine news items and KPBTE DIT result links
2. **Modern & Wowing UI/UX**:
   - Modern color palette tailored for Pakistani educational excellence (Deep Academic Blue `#0a2540`, Emerald Green `#047857`, Gold `#f59e0b`)
   - Smooth animated hero carousel with auto-play & pause on hover
   - Animated statistics counters (`80% Practical`, `6+ Trades`, `1500+ Alumni`)
   - Interactive Lightbox modal to inspect workshop machinery photos
   - Responsive mobile drawer navigation
   - Online Admission application form with instant registration reference generator
3. **Optimized Performance**:
   - Zero bulky dependencies — pure vanilla HTML5, modern CSS3, and lightweight JavaScript.
   - All 50+ real images stored locally in `assets/images/` for fast offline loading.

---

## 💻 How to View & Run Locally

### Option 1: Double Click
Simply double-click on `index.html` to open it in any web browser (Chrome, Edge, Firefox).

### Option 2: Local Web Server (Node.js)
If you have Node.js installed, you can start a local development server:
```powershell
npx -y serve .
```
Then visit `http://localhost:3000` in your browser.

---

## ✏️ How to Customize / Update
Check [HOW_TO_UPDATE.md](docs/HOW_TO_UPDATE.md) for clear instructions on how to add notices, modify phone numbers, or update course descriptions.
