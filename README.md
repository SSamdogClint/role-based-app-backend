# Full-Stack Role-Based SPA
**By Clint Eroll A. Capondag**

A Role-Based Single Page Application built with vanilla JavaScript (frontend) and Node.js + Express.js (backend). The frontend uses localStorage for employees, departments, and requests, while authentication is handled by the backend using JWT tokens.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 + Bootstrap 5 |
| Style | CSS3 Custom Overrides |
| Logic | Vanilla JavaScript (ES6+) |
| Backend | Node.js + Express.js |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Storage | localStorage + sessionStorage |

---

## Features

- JWT-based login with token stored in `sessionStorage`
- Role-based UI — admin links hidden from regular users
- Client-side routing via URL hash (`#/login`, `#/employees`, etc.)
- Dual login — backend users (admin, alice) + localStorage registered users
- Simulated email verification flow
- Token expiry check on page load (fake/expired tokens cleared automatically)
- CRUD for Employees, Departments, and Requests via localStorage
- Admin can approve/reject user requests

---

## Setup & Installation

### 1. Clone or download the project

```
fullstack-prototype-capondag/   ← frontend
role-based-app-backend/         ← backend
```

### 2. Install backend dependencies

```bash
cd role-based-app-backend
npm install
```

### 3. Start the backend

```bash
npm run dev
```

Backend runs on `http://localhost:3000`

### 4. Start the frontend

Open `index.html` with **VS Code Live Server** on port `5500`:
```
http://127.0.0.1:5500/index.html
```

---

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| User | `alice` | `user123` |

---

## API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/register` | Public | Register a new user |
| POST | `/api/login` | Public | Login and receive JWT token |
| GET | `/api/profile` | Authenticated | Get current user profile |
| GET | `/api/admin/dashboard` | Admin only | Access admin dashboard |
| GET | `/api/content/guest` | Public | Public content |

---

## Security

- JWT tokens expire after **2 minutes**
- Fake or expired tokens are cleared automatically on page load
- Backend validates every protected request using `authenticateToken` middleware
- Role checks enforced server-side using `authorizeRole()` middleware — frontend manipulation cannot bypass backend security
