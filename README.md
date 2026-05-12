# UniSync

**Your Campus, Synchronized**

UniSync is a full-stack web application built for university students at FAST-NU. It centralizes campus life by providing a single platform to discover and join clubs, browse and register for events, communicate with club members, and manage club operations — all with real-time updates.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [User Roles](#user-roles)
- [Database](#database)
- [Deployment](#deployment)

---

## Overview

UniSync targets students and club executives at FAST-NU campuses. Registration is restricted to official university email addresses (`@<campus>.nu.edu.pk`). Once logged in, students can explore clubs, RSVP to events, and chat with club members. Club executives get a dedicated dashboard to manage their club's members, events, announcements, open positions, and join requests.

---

## Features

### Authentication
- Register and login with FAST-NU university email only
- JWT-based sessions (7-day expiry)
- bcrypt password hashing
- Password change from profile settings

### Student Features
- Browse and filter clubs by category
- Join or leave clubs
- Request to join a club (with an interview workflow)
- Browse and filter events; view event details and reviews
- RSVP to events and receive a unique ticket ID
- Save events for later
- Apply for open positions in clubs
- View application status
- Club chat — send and receive messages in any club you belong to
- In-app notifications (with real-time push via SSE)
- Edit profile — bio, student ID, department, program, year, social links, interests, avatar

### Executive Features
- Create, update, and delete clubs
- Add or remove club members directly by email
- Manage join requests: schedule interviews, accept or reject
- Post announcements to all club members
- Create and manage open positions
- Review position applications and update their status
- Post event updates (with optional payment details)
- View detailed member profiles

### Real-time
- Server-Sent Events (SSE) stream pushes instant updates to connected clients
- Events pushed: new notifications, club updates, membership changes, new applications, interview scheduling, join request decisions, event posts, club announcements

### PWA
- Installable as a Progressive Web App on mobile and desktop
- Standalone display mode, themed splash screen

---

## Tech Stack

**Frontend**
- Vanilla HTML, CSS, JavaScript (single-page application with view switching)
- Inter and Outfit fonts via Google Fonts
- Three.js (animated background on login page)
- EmailJS (client-side email integration)
- QRCode.js (ticket QR codes)

**Backend**
- Node.js with Express
- Supabase (PostgreSQL database + JS client)
- JSON Web Tokens (`jsonwebtoken`) for auth
- bcryptjs for password hashing
- Server-Sent Events for real-time push
- `compression` middleware for gzip responses
- `cors` with open origin (suitable for local and Vercel deployments)

---

## Project Structure

```
Unisync/
├── index.html          # Main app shell (all views rendered here)
├── login.html          # Login and registration page
├── style.css           # All application styles
├── app.js              # Frontend JavaScript (all client-side logic)
├── data.js             # Static seed/reference data
├── manifest.json       # PWA manifest
├── vercel.json         # Vercel deployment rewrites
├── start.bat           # One-click launcher for Windows
├── logo.png
├── logo_shield.png
├── api/
│   └── index.js        # Vercel serverless entry point
└── server/
    ├── server.js       # Express app entry point
    ├── supabase.js     # Supabase client singleton
    ├── package.json
    ├── .env            # Environment variables (not committed)
    ├── middleware/
    │   └── auth.js     # JWT verification middleware
    └── routes/
        ├── auth.js         # /api/auth — register, login, change-password
        ├── clubs.js        # /api/clubs — list and fetch clubs
        ├── events.js       # /api/events — list and fetch events
        ├── user.js         # /api/user — profile, RSVP, memberships, applications, notifications
        ├── executive.js    # /api/executive — club/event/position/member management
        ├── chat.js         # /api/chat — club chat messages
        ├── announcements.js
        ├── positions.js
        └── realtime.js     # /api/realtime/stream — SSE endpoint
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A Supabase project with the required tables (see [Database](#database))

### Running Locally (Windows)

The easiest way is to use the included launcher:

```
start.bat
```

This will install dependencies, start the backend server, and open the app in your browser automatically.

### Manual Setup

1. Install backend dependencies:

```bash
cd server
npm install
```

2. Create the `.env` file inside `server/` (see [Environment Variables](#environment-variables)).

3. Start the server:

```bash
npm start
```

4. Open `login.html` directly in your browser, or navigate to:

```
http://localhost:3001
```

### Development (with auto-reload)

```bash
cd server
npm run dev
```

---

## Environment Variables

Create a file at `server/.env` with the following:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=a_strong_random_secret_string
PORT=3001
```

> **Do not commit `.env` to version control.** Replace `JWT_SECRET` with a securely generated random string before deploying to production.

---

## API Reference

All API routes are prefixed with `/api`. Protected routes require a `Bearer <token>` header or a `?token=` query parameter (the query param is used for the SSE stream since `EventSource` does not support custom headers).

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Register a new user |
| POST | `/login` | No | Login and receive a JWT |
| PUT | `/change-password` | Yes | Change the authenticated user's password |

### Clubs — `/api/clubs`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | List all clubs |
| GET | `/:id` | No | Get a single club |
| GET | `/:id/posts` | No | Get event posts for a club |
| GET | `/:id/members` | Yes | Get members of a club |

### Events — `/api/events`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | List all events |
| GET | `/:id` | No | Get a single event |
| POST | `/:id/view` | No | Increment view count |

### User — `/api/user`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profile` | Yes | Get own profile |
| PUT | `/profile` | Yes | Update own profile |
| POST | `/rsvp` | Yes | RSVP to an event |
| GET | `/rsvps` | Yes | List own RSVPs |
| POST | `/save-event` | Yes | Toggle save/unsave an event |
| GET | `/saved-events` | Yes | List saved event IDs |
| POST | `/join-club` | Yes | Toggle join/leave a club |
| GET | `/memberships` | Yes | List joined club IDs |
| POST | `/apply` | Yes | Apply for a club position |
| GET | `/applications` | Yes | List own applications |
| GET | `/notifications` | Yes | List notifications |
| PUT | `/notifications/read-all` | Yes | Mark all notifications as read |

### Chat — `/api/chat`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/:clubId` | No | Fetch last 100 messages for a club |
| POST | `/:clubId` | Yes | Send a message |

### Realtime — `/api/realtime`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stream` | Yes (query param) | Open SSE stream |

### Executive — `/api/executive`

All routes require authentication and the `executive` role. Club mutation routes additionally verify that the requesting executive owns the target club.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/clubs/my` | Get own clubs |
| POST | `/clubs` | Create a club |
| PUT | `/clubs/:id` | Update club details |
| DELETE | `/clubs/:id` | Delete a club and all related data |
| GET | `/clubs/:id/members` | List club members |
| POST | `/clubs/:id/members` | Add a member by email |
| DELETE | `/clubs/:id/members/:userId` | Remove a member |
| POST | `/clubs/:id/announcements` | Post an announcement to all members |
| GET | `/clubs/:id/requests` | View pending/interview join requests |
| PUT | `/requests/:requestId/interview` | Schedule an interview |
| PUT | `/requests/:requestId` | Accept or reject a request |
| POST | `/clubs/:id/posts` | Create an event post |
| GET | `/clubs/:id/posts` | List event posts |
| GET | `/clubs/:id/applications` | List position applications |
| PUT | `/applications/:id` | Update application status |
| GET | `/user/:userId/profile` | View any user's profile |

---

## User Roles

| Role | Description |
|------|-------------|
| `student` | Default role. Can join clubs, RSVP to events, apply to positions, and chat. |
| `executive` | Can create and manage clubs, post announcements, handle join requests, manage members, and manage positions. |

Role is set at registration and stored in the JWT payload.

---

## Database

The application uses Supabase (PostgreSQL). The following tables are expected:

| Table | Description |
|-------|-------------|
| `users` | Registered users with profile fields and role |
| `clubs` | Club records with metadata and executive ownership |
| `club_memberships` | Many-to-many: users ↔ clubs |
| `club_leaders` | Named leader entries per club |
| `club_announcements` | Announcements posted by executives |
| `club_join_requests` | Join requests with status workflow (`pending` → `interview` → `accepted`/`rejected`) |
| `events` | Event records linked to clubs |
| `event_reviews` | User reviews for events |
| `event_posts` | Rich posts created by executives for events |
| `rsvps` | Event registrations with ticket IDs |
| `saved_events` | User-saved events |
| `positions` | Open positions within clubs |
| `applications` | Applications submitted for positions |
| `chat_messages` | Per-club chat messages |
| `notifications` | In-app notifications per user |

Two Supabase RPC functions are used for atomic member count updates: `increment_members` and `decrement_members` (both accept `club_id_input`).

---

## Deployment

The project includes a `vercel.json` configuration that routes all `/api/*` requests to the serverless function at `api/index.js` and serves all other paths as static files.

To deploy on Vercel:

1. Set the environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `JWT_SECRET`) in the Vercel project settings.
2. Push the repository — Vercel will detect the config and deploy automatically.

---

## Authors

Hammad, Sameer, Ubaid
