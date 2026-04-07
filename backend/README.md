# Annotator Platform Backend

A comprehensive backend API for the Annotator Assessment & Evaluation Platform built with Express.js, TypeScript, Prisma, and PostgreSQL.

## Features

- **Authentication**: JWT-based authentication with secure password hashing
- **Exam Management**: Create, update, delete exams with MCQ and subjective questions
- **Attempt System**: Start attempts, save answers, auto-submit on timeout
- **Evaluation Engine**: Automatic scoring based on:
  - Accuracy (40%)
  - Grammar (20%)
  - Plagiarism detection (20%)
  - Typing speed (20%)
  - Prompt quality
- **Admin Panel**: User management, attempt reset, analytics
- **Security**: Input validation, protected routes, role-based access

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Validation**: Zod

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
│       ├── auth.ts         # JWT & password hashing
│       ├── evaluation.ts   # Scoring engine
│       ├── prisma.ts       # Prisma client
│       └── validation.ts   # Zod schemas
├── .env.example            # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT signing
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: development/production

### 3. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio
npx prisma studio
```

### 4. Run the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Exams
- `GET /api/exams` - List active exams
- `GET /api/exams/:id` - Get exam details
- `POST /api/exams` - Create exam (Admin)
- `PUT /api/exams/:id` - Update exam (Admin)
- `DELETE /api/exams/:id` - Delete exam (Admin)

### Attempts
- `POST /api/attempts/start` - Start new attempt
- `POST /api/attempts/save-answer` - Save answer
- `POST /api/attempts/submit` - Submit attempt
- `GET /api/attempts/my-attempts` - Get my attempts
- `GET /api/attempts/:id` - Get attempt details
- `POST /api/attempts/track-paste` - Track paste event
- `POST /api/attempts/track-tab-switch` - Track tab switch

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard stats
- `GET /api/dashboard/scores` - Get my scores
- `GET /api/dashboard/scores/:id` - Get score details

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/reset-attempts` - Reset user attempts
- `POST /api/admin/update-status` - Update user status
- `GET /api/admin/plagiarism-reports` - Get plagiarism reports
- `GET /api/admin/analytics` - Get analytics
- `GET /api/admin/actions` - Get admin actions log

## Evaluation Formula

```
final_score =
  (accuracy * 0.4) +
  (grammar * 0.2) +
  (plagiarism * 0.2) +
  (typing_speed * 0.2)
```

- **Pass Mark**: 80%
- **Max Attempts**: 3

## Database Schema

### Core Tables
- `users` - User accounts
- `exams` - Exam definitions
- `questions` - Exam questions
- `options` - MCQ options
- `attempts` - User attempts
- `answers` - User answers
- `scores` - Evaluation scores
- `plagiarism_reports` - Plagiarism detection results
- `admin_actions` - Admin action log

## License

MIT
