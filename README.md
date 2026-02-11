# PrepMate — Intelligent Academic Planner

> A smart academic planning and productivity platform that helps students manage coursework, deadlines, and study sessions with AI-powered scheduling.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Developer Documentation](#developer-documentation)
- [License](#license)

---

## Overview

**PrepMate** is a full-stack web application built for university students to organise their academic lives. It combines a customisable weekly timetable, a task/assessment tracker, and an **AI-powered study plan generator** that schedules optimised study sessions around existing commitments.

The platform is built with **Next.js (App Router)**, uses **MongoDB** for persistence, and secures all routes with **JWT-based authentication**. A clean, responsive UI (powered by Tailwind CSS) supports both light and dark themes.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **User Authentication** | Secure registration and login with bcrypt-hashed passwords and HTTP-only JWT cookies. |
| **Dashboard** | At-a-glance view of upcoming deadlines, pending tasks, and scheduled study sessions. |
| **Timetable Management** | Build a weekly timetable with custom time slots and break periods. |
| **Task & Assessment Tracking** | Create, edit, and track assignments/projects with deadlines, estimated hours, and priority levels. |
| **AI Study Plan Generation** | One-click generation of an optimised study schedule that respects your timetable, priorities, and deadlines. |
| **Profile Management** | Update personal details, enrolled courses, study preferences, and daily available hours. |
| **Dark / Light Theme** | Toggle between themes with automatic persistence via `localStorage`. |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [Next.js](https://nextjs.org/) 16 (App Router) |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS 4 |
| **Database** | MongoDB (via Mongoose 9) |
| **Authentication** | JWT (`jsonwebtoken`) + bcrypt |
| **Testing** | Jest 30 + React Testing Library |
| **Icons** | `react-icons` |

---

## Prerequisites

Before you begin, make sure you have the following installed:

- **[Node.js](https://nodejs.org/)** v18 or later
- **npm** (comes with Node.js)
- **[MongoDB](https://www.mongodb.com/)** — either a local instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

---

## Installation

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables** (see [Environment Variables](#environment-variables) below)

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a file named **`.env.local`** in the project root with the following variables:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your-secret-key-here
```

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | Connection string for your MongoDB instance or Atlas cluster. |
| `JWT_SECRET` | A secret key used to sign and verify JSON Web Tokens. Use a strong, random string in production. |

> **Note:** `.env.local` is included in `.gitignore` and will **not** be committed to version control.

---

## Running the App

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Next.js development server on `http://localhost:3000` |
| `npm run build` | Create a production-optimised build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint to check for code quality issues |

---

## Running Tests

The project uses **Jest** and **React Testing Library**. To run the full test suite:

```bash
npm test
```

Tests are located in the `__tests__/` directory and cover:

- **Unit tests** — Scheduler helper functions (`calculatePriority`, `parseTime`, `calculateFreeIntervals`)
- **Integration tests** — JWT utilities (`signToken`, `verifyToken`)
- **Component tests** — Navbar rendering, theme toggling, and localStorage persistence

For the complete testing documentation (strategy, configuration, and detailed test summaries), see [DEVDOCS.md](DEVDOCS.md#testing).

---

## Project Structure

```
SE_Project/
├── middleware.js               # JWT route protection
├── jest.config.mjs             # Jest configuration
├── .env.local                  # Environment variables (not committed)
│
├── src/
│   ├── app/
│   │   ├── page.jsx            # Landing page (redirects to login/dashboard)
│   │   ├── globals.css         # Design tokens & theme variables
│   │   │
│   │   ├── (auth)/             # Public routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   │
│   │   ├── (protected)/        # Auth-guarded routes
│   │   │   ├── dashboard/
│   │   │   ├── timetable/
│   │   │   ├── tasks/
│   │   │   ├── planner/
│   │   │   └── profile/
│   │   │
│   │   └── api/                # REST API routes
│   │       ├── auth/           #   Login, Register, Logout, Profile, Courses, Timetable
│   │       ├── tasks/          #   CRUD for tasks
│   │       ├── scheduler/      #   AI study plan generation
│   │       └── studysessions/  #   Study session retrieval
│   │
│   ├── components/             # Reusable React components
│   ├── lib/                    # Utilities (DB connection, JWT helpers, scheduler algorithm)
│   └── models/                 # Mongoose schemas (User, Course, Task, Timetable, etc.)
│
└── __tests__/                  # Jest test suites
```

---

## Developer Documentation

For in-depth technical documentation — including architecture diagrams, database models, the full API reference, component specs, the scheduler algorithm, and testing details — see **[DEVDOCS.md](DEVDOCS.md)**.

---
