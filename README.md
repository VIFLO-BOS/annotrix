# Annotator Assessment & Evaluation Platform

A comprehensive full-stack web application for assessing and evaluating annotators through automated exams with multi-dimensional scoring.

## Features

### Core Features
- **User Authentication**: JWT-based secure login/registration
- **Role-Based Access**: Separate dashboards for Users and Admins
- **Exam System**: MCQ and subjective question types with timer
- **Automatic Evaluation**: Multi-dimensional scoring system
- **Attempt Management**: Track and limit user attempts (max 3)
- **Anti-Cheating**: Paste detection, tab switch monitoring

### Evaluation Metrics
- **Accuracy (40%)**: Correct answers to questions
- **Grammar (20%)**: Language quality assessment
- **Typing Speed (20%)**: Words per minute tracking
- **Plagiarism (20%)**: Copy-paste detection and similarity checking
- **Prompt Quality**: Clarity, originality, and logical reasoning

### Admin Features
- Create and manage exams
- Monitor user attempts and scores
- Reset user attempts
- Disqualify/reactivate users
- View plagiarism reports
- Analytics dashboard

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Validation**: Zod

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Radix UI + Custom components

## Project Structure

```
annotator-platform/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Auth & error handlers
│   │   ├── routes/             # API routes
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Utilities (auth, evaluation, validation)
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js app router
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # Utilities
│   │   ├── services/           # API services
│   │   ├── store/              # Zustand stores
│   │   └── types/              # TypeScript types
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Setup database:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API URL
```

4. Start the development server:
```bash
npm run dev
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

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard stats
- `GET /api/dashboard/scores` - Get my scores

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/reset-attempts` - Reset user attempts
- `POST /api/admin/update-status` - Update user status
- `GET /api/admin/analytics` - Get analytics

## Scoring Formula

```
final_score =
  (accuracy * 0.4) +
  (grammar * 0.2) +
  (plagiarism * 0.2) +
  (typing_speed * 0.2)
```

- **Pass Mark**: 80%
- **Max Attempts**: 3
- **Disqualification**: After 3 failed attempts

## Database Schema

### Core Tables
- `users` - User accounts with role and status
- `exams` - Exam definitions
- `questions` - Exam questions (MCQ/Subjective)
- `options` - MCQ options
- `attempts` - User exam attempts
- `answers` - User answers per question
- `scores` - Evaluation scores
- `plagiarism_reports` - Plagiarism detection results
- `admin_actions` - Admin action log

## Security Features

- JWT-based authentication
- Password hashing (PBKDF2)
- Input validation (Zod)
- Protected routes
- Role-based access control
- Anti-cheating measures:
  - Paste event detection
  - Tab switch monitoring
  - Similarity checking

## Development

### Running Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Building for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
