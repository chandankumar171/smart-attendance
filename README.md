# AI Based Smart Attendance System

<div align="center">

![Smart Attendance](https://img.shields.io/badge/Smart-Attendance-indigo?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green?style=for-the-badge&logo=mongodb)
![Socket.io](https://img.shields.io/badge/Socket.io-4.6-black?style=for-the-badge&logo=socket.io)

A full-stack web application that marks student attendance automatically using **face recognition**, restricted to the **institute's WiFi network**.

[Live Demo](https://smart-attendance-woad-nine.vercel.app) · [Backend API](https://smart-attendance-backend-7hsj.onrender.com/api/health)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [How Face Recognition Works](#how-face-recognition-works)
- [How IP Restriction Works](#how-ip-restriction-works)
- [Attendance Rules](#attendance-rules)
- [API Endpoints](#api-endpoints)
- [Roles and Permissions](#roles-and-permissions)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## Overview

The AI Based Smart Attendance System automates student attendance using face recognition technology. Students can mark their attendance through a webcam — the system detects their face, compares it with stored face data, and automatically records attendance. Attendance is only allowed when the student is connected to the institute's WiFi network, enforced securely on the backend.

Administrators have a separate dashboard to monitor attendance in real time, view records, and export data.

---

## Features

### Student Features
- Register account with name, email, student ID, course and batch
- Register face data via webcam (stored as 128-dimensional descriptor)
- Mark attendance automatically using face recognition
- View today's attendance status (Present / Late / Absent)
- View full attendance history with stats and percentage
- Attendance restricted to institute WiFi network

### Admin Features
- Separate admin dashboard with role-based access
- Real-time attendance feed (updates without page refresh)
- View daily attendance records for any date
- View per-student attendance history with percentage
- Stats cards showing Total / Present / Late / Absent counts
- Export attendance data as CSV
- Auto-absent marking via scheduled cron job

### System Features
- JWT-based authentication with role guards
- Server-side IP range validation (cannot be bypassed from browser)
- Duplicate attendance prevention (one record per student per day)
- Automatic absent marking at 10:30 AM via cron job
- Real-time updates via Socket.io
- Working days calculation (Monday to Saturday, excluding Sunday)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 18, Tailwind CSS |
| Face Detection | face-api.js (TinyFaceDetector + FaceRecognitionNet) |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Real-time | Socket.io |
| Authentication | JWT (JSON Web Tokens) |
| Password Hashing | bcryptjs |
| IP Validation | request-ip + ip-range-check |
| Scheduled Jobs | node-cron |
| Deployment | Vercel (frontend) + Render (backend) + MongoDB Atlas (database) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Student   │  │    Admin     │  │  face-api.js   │  │
│  │  Dashboard  │  │  Dashboard   │  │  (Webcam AI)   │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                │                   │          │
│         └────────────────┴───────────────────┘          │
│                          │                              │
│              REST API + Socket.io (WS)                  │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    Backend (Express)                    │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │ Auth Routes  │  │ Attendance  │  │  Admin Routes  │  │
│  │   /api/auth  │  │   Routes    │  │  /api/admin    │  │
│  └──────────────┘  └─────────────┘  └────────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │     JWT      │  │  IP Check   │  │   Socket.io    │  │
│  │ Middleware   │  │ Middleware  │  │    Server      │  │
│  └──────────────┘  └─────────────┘  └────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │           node-cron (Auto-absent at 10:30 AM)    │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                   MongoDB Database                      │
│         ┌──────────────┐    ┌──────────────┐            │
│         │  Users       │    │  Attendance  │            │
│         │  Collection  │    │  Collection  │            │
│         └──────────────┘    └──────────────┘            │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
smart-attendance/
│
├── frontend/                          # React frontend
│   ├── public/
│   │   ├── index.html
│   │   └── models/                   # face-api.js weight files
│   │       ├── tiny_face_detector_model-weights_manifest.json
│   │       ├── tiny_face_detector_model-shard1
│   │       ├── face_landmark_68_model-weights_manifest.json
│   │       ├── face_landmark_68_model-shard1
│   │       ├── face_recognition_model-weights_manifest.json
│   │       ├── face_recognition_model-shard1
│   │       └── face_recognition_model-shard2
│   │
│   └── src/
│       ├── components/
│       │   ├── face/
│       │   │   └── FaceCapture.jsx   # Webcam + live detection + capture
│       │   ├── attendance/
│       │   │   ├── AttendanceHistory.jsx
│       │   │   ├── DailyAttendanceTable.jsx
│       │   │   └── StudentTable.jsx
│       │   └── ui/
│       │       ├── Navbar.jsx
│       │       └── StatsCard.jsx
│       ├── context/
│       │   └── AuthContext.jsx       # Global auth state
│       ├── hooks/
│       │   └── useSocket.js          # Socket.io real-time hook
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── StudentDashboard.jsx
│       │   └── AdminDashboard.jsx
│       └── utils/
│           ├── api.js                # Axios with JWT interceptor
│           └── faceUtils.js          # face-api.js helpers
│
└── backend/                          # Express backend
    ├── config/
    │   └── db.js                     # MongoDB connection
    ├── controllers/
    │   ├── authController.js
    │   ├── attendanceController.js
    │   ├── adminController.js
    │   └── studentController.js
    ├── jobs/
    │   └── cronJobs.js               # Auto-absent + admin seed
    ├── middleware/
    │   ├── authMiddleware.js         # JWT verification + role guards
    │   └── ipMiddleware.js           # Institute WiFi IP check
    ├── models/
    │   ├── User.js
    │   └── Attendance.js
    ├── routes/
    │   ├── auth.js
    │   ├── attendance.js
    │   ├── admin.js
    │   └── student.js
    ├── utils/
    │   └── attendanceUtils.js
    ├── socket.js                     # Socket.io server
    ├── app.js                        # Express app config
    └── server.js                     # Entry point
```

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- MongoDB (local) or MongoDB Atlas account
- A webcam
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/chandankumar171/smart-attendance.git
cd smart-attendance
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Download face-api.js Models

Download all 7 model files from:
👉 https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Place all files inside `frontend/public/models/`

Required files:
```
tiny_face_detector_model-weights_manifest.json
tiny_face_detector_model-shard1
face_landmark_68_model-weights_manifest.json
face_landmark_68_model-shard1
face_recognition_model-weights_manifest.json
face_recognition_model-shard1
face_recognition_model-shard2
```

### 4. Configure Environment Variables

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/smart_attendance
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=604800
ALLOWED_IP_RANGES=192.168.0.0/24,127.0.0.1/32,::1/128
ATTENDANCE_LATE_HOUR=9
ATTENDANCE_LATE_MINUTE=30
ATTENDANCE_CLOSE_HOUR=10
ATTENDANCE_CLOSE_MINUTE=0
AUTO_ABSENT_HOUR=10
AUTO_ABSENT_MINUTE=30
ADMIN_EMAIL=admin@institute.edu
ADMIN_PASSWORD=Admin@123
CLIENT_URL=http://localhost:3000
TZ=Asia/Kolkata
```

Create `frontend/.env.development`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 5. Start MongoDB

```bash
# Windows
net start MongoDB

# Or manually
mongod --dbpath "C:\data\db"
```

### 6. Run the Application

```bash
# Terminal 1 — Start backend
cd backend
npm run dev

# Terminal 2 — Start frontend
cd frontend
npm start
```

Open http://localhost:3000

### Default Admin Credentials

```
Email:    admin@institute.edu
Password: Admin@123
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/smart_attendance` |
| `JWT_SECRET` | Secret key for JWT signing | `any_long_random_string` |
| `JWT_EXPIRES_IN` | Token expiry in seconds | `604800` (7 days) |
| `ALLOWED_IP_RANGES` | Institute WiFi IP ranges (CIDR) | `192.168.0.0/24,127.0.0.1/32` |
| `ATTENDANCE_LATE_HOUR` | Hour when late window starts | `9` |
| `ATTENDANCE_LATE_MINUTE` | Minute when late window starts | `30` |
| `ATTENDANCE_CLOSE_HOUR` | Hour when attendance closes | `10` |
| `ATTENDANCE_CLOSE_MINUTE` | Minute when attendance closes | `0` |
| `AUTO_ABSENT_HOUR` | Hour when cron marks absent | `10` |
| `AUTO_ABSENT_MINUTE` | Minute when cron marks absent | `30` |
| `ADMIN_EMAIL` | Default admin email | `admin@institute.edu` |
| `ADMIN_PASSWORD` | Default admin password | `Admin@123` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Frontend (`frontend/.env.development`)

| Variable | Description | Example |
|---|---|---|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `REACT_APP_SOCKET_URL` | Socket.io server URL | `http://localhost:5000` |

---

## How Face Recognition Works

```
Step 1 — Registration
Student opens webcam → face-api.js detects face
→ Extracts 128-dimensional descriptor (array of 128 numbers)
→ Descriptor stored in MongoDB with student record

Step 2 — Attendance
Student opens webcam → face-api.js extracts descriptor
→ Descriptor sent to backend via POST /api/attendance/mark
→ Backend calculates Euclidean distance between submitted
  descriptor and stored descriptor
→ Distance < 0.5 = match → attendance marked
→ Distance ≥ 0.5 = no match → rejected
```

### Why Euclidean Distance?

Each face is represented as a point in 128-dimensional space. Two images of the same person will produce descriptors that are close together (small distance). Different people produce descriptors that are far apart (large distance).

```
Distance = √( Σ (a[i] - b[i])² )  for i = 0 to 127

Threshold = 0.5 (face-api.js recommended value)
Distance < 0.5 → Same person ✓
Distance ≥ 0.5 → Different person ✗
```

### Models Used

| Model | Purpose |
|---|---|
| TinyFaceDetector | Detects if a face is present in the frame |
| FaceLandmark68Net | Maps 68 key points on the face |
| FaceRecognitionNet | Converts face to 128-d descriptor vector |

---

## How IP Restriction Works

The IP check runs **entirely on the backend** — it cannot be bypassed from the browser.

```
Student clicks Mark Attendance
        ↓
POST /api/attendance/mark
        ↓
ipMiddleware.js extracts client IP using request-ip
        ↓
Normalizes IPv6-mapped addresses (::ffff:192.168.0.5 → 192.168.0.5)
        ↓
Checks if IP falls within ALLOWED_IP_RANGES using ip-range-check
        ↓
IP in range  → proceeds to face verification → marks attendance
IP not in range → 403 error: "Attendance is only allowed when
                              connected to institute WiFi"
```

### Setting the Institute IP Range

Find your institute's WiFi IP range and update `ALLOWED_IP_RANGES` in `.env`:

```env
# Example: allows 192.168.1.0 to 192.168.1.255
ALLOWED_IP_RANGES=192.168.1.0/24

# Multiple ranges (comma separated)
ALLOWED_IP_RANGES=192.168.0.0/24,192.168.1.0/24,127.0.0.1/32
```

---

## Attendance Rules

| Time | Status |
|---|---|
| Before 9:30 AM | Present ✅ |
| 9:30 AM – 10:00 AM | Late ⚠️ |
| After 10:00 AM | Attendance Closed ❌ |
| 10:30 AM (cron job) | Remaining students auto-marked Absent |

### Working Days
- Monday to Saturday are counted as working days
- Sunday is excluded from working day calculation

### Duplicate Prevention
- Only one attendance record allowed per student per day
- Attempting to mark again shows: *"Attendance already recorded for today"*

### Percentage Calculation
```
Attendance % = (Present + Late) / Total Working Days × 100
```
Late counts as attended — only absent reduces the percentage.

---

## API Endpoints

### Auth Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register new student |
| POST | `/login` | Public | Login (student or admin) |
| GET | `/me` | Private | Get current user |
| POST | `/register-face` | Student | Save face descriptor |

### Attendance Routes (`/api/attendance`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/mark` | Student + IP check | Mark attendance via face |
| GET | `/my` | Student | Own attendance history |
| GET | `/today` | Student | Today's status |

### Admin Routes (`/api/admin`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/students` | Admin | All registered students |
| GET | `/attendance/daily` | Admin | Daily records (`?date=YYYY-MM-DD`) |
| GET | `/attendance/student/:id` | Admin | Per-student history |
| GET | `/stats` | Admin | Today's stats |
| GET | `/export` | Admin | Export CSV (`?date=YYYY-MM-DD`) |
| POST | `/attendance/manual` | Admin | Manual attendance override |

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server status check |

---

## Roles and Permissions

### Student
- Register and login
- Register face data via webcam
- Mark attendance (only on institute WiFi, within time window)
- View own attendance history and stats

### Admin
- Login with seeded admin credentials
- View all registered students and face registration status
- Monitor real-time attendance feed (Socket.io)
- View and filter daily attendance records
- View per-student attendance history with percentage
- Export attendance as CSV
- Manually override attendance records

---

## Deployment

### Live URLs
- **Frontend:** https://smart-attendance-woad-nine.vercel.app/
- **Backend:** https://smart-attendance-backend-7hsj.onrender.com

### Frontend — Vercel

1. Push code to GitHub
2. Import repository on https://vercel.com
3. Set root directory to `frontend`
4. Add environment variables:
```
REACT_APP_API_URL=https://your-backend.onrender.com/api
REACT_APP_SOCKET_URL=https://your-backend.onrender.com
```

### Backend — Render

1. Import repository on https://render.com
2. Set root directory to `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all environment variables from `backend/.env`
6. Set `CLIENT_URL` to your Vercel frontend URL

### Database — MongoDB Atlas

1. Create free cluster at https://cloud.mongodb.com
2. Create database user with read/write access
3. Allow all IP addresses in Network Access (`0.0.0.0/0`)
4. Copy connection string to `MONGO_URI` environment variable

---

## Security

| Feature | Implementation |
|---|---|
| Password hashing | bcryptjs with 12 salt rounds |
| Authentication | JWT tokens with 7-day expiry |
| Role protection | Middleware checks `user.role` on every protected route |
| IP validation | Server-side only — cannot be spoofed from browser |
| Face descriptors | Never returned to client in any API response |
| Sensitive fields | `password` and `faceDescriptor` excluded from all queries |

---

## Important Notes

1. **Face model files** must be present in `frontend/public/models/` for face recognition to work
2. **Webcam access** requires HTTPS in production (Vercel provides this automatically)
3. **Render free tier** spins down after 15 minutes of inactivity — first request may take 30-50 seconds
4. **Admin account** is auto-created on first server start using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`
5. **IP ranges** should be updated to the actual institute WiFi range before production use
