# Taskly — Task Manager & Calendar Planner App

**Taskly** is a fast, intuitive, cross-platform task manager with an integrated monthly calendar overview. Designed with a distraction-free grey and white aesthetic theme, Taskly helps students, professionals, and daily planners stay organized.

![Taskly Overview](https://img.shields.io/badge/Version-1.0-black?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-gray?style=flat-square)

---

## 🌟 Key Features

- 📅 **Integrated Month Calendar View**: Plot tasks on a visual monthly grid with status indicator dots (*To Do, In Progress, Completed*) and count badges.
- 📌 **Tap-to-View Day Schedule**: Tapping any day cell reveals the detailed schedule for that date, with quick actions to add, edit, complete, or delete tasks.
- ⚡ **AI Smart Quick Input**: Type naturally (e.g. `"Work meeting tomorrow at 3pm"`, `"Calculus Exam on 2026-08-25 at 10am"`) to auto-parse title, category, target date, and time.
- 🔔 **Alarm & Notification Reminders**: Multi-channel reminders with Web Audio API chime sound, desktop Web Notifications, and an in-app animated ringing clock modal.
- 👤 **User Authentication & Data Persistence**: Sign up and log in to save isolated task databases per account across sessions.
- 📱 **Automatic Landscape & Portrait Adaptation**: Smoothly switches between mobile portrait layout and side-by-side dual-pane landscape layout.
- 🎨 **Grey & White Design System**: Distraction-free monochrome theme with Light/Dark mode toggling.
- 📊 **Productivity Metrics & Data Backup**: Track task completion rates and export/import data in JSON format.

---

## 🚀 Getting Started

### Prerequisites
No node_modules or build tools required! Built using modern HTML5, ES6 Modules, and Vanilla CSS.

### Running Locally

```bash
# Clone the repository
git clone https://github.com/xdamarisdiamondx-hash/Taskly.git
cd Taskly

# Run local server with PowerShell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```

Open **`http://localhost:8080/`** in your browser.

---

## 📁 Repository Structure

```
Taskly/
├── index.html           # Main HTML5 application shell & modals
├── css/
│   └── styles.css       # Grey & white design system, themes, landscape rules
├── js/
│   ├── app.js           # Launcher, router & toast system
│   ├── auth.js          # Account registration, login, session manager
│   ├── storage.js       # Per-user isolated LocalStorage engine
│   ├── calendar.js      # Month grid & tap-to-view day schedule
│   ├── taskManager.js   # Task CRUD, filters, & search
│   ├── aiParser.js      # Natural language AI parser
│   ├── notifications.js # Alarm & notification reminder engine
│   ├── onboarding.js   # Walkthrough screens controller
│   └── profile.js       # User profile & metrics dashboard
├── serve.ps1            # Lightweight PowerShell web server
└── README.md
```

---

## 📄 License

Distributed under the MIT License.
