# AI MCQ Generator

A production-ready SaaS application that uses AI to generate multiple-choice questions (MCQs) from uploaded documents (PDF, DOCX, TXT). Built with FastAPI (backend) and Next.js (frontend).

## Features

- **Document Upload**: Support for PDF, DOCX, and TXT files
- **AI-Powered Question Generation**: Uses OpenAI/OpenRouter to generate high-quality MCQs
- **Interactive Quiz System**: Timer, navigation, and smooth animations
- **Detailed Analytics**: Performance trends, topic-wise analysis, and improvement suggestions
- **PDF Export**: Download quiz results and analytics as PDF reports
- **Modern UI**: Built with Tailwind CSS, Shadcn UI, and Framer Motion animations
- **Authentication**: JWT-based secure authentication system

## Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **PostgreSQL**: Relational database
- **Alembic**: Database migration tool
- **Pydantic**: Data validation using Python type annotations
- **OpenAI/OpenRouter**: AI API for question generation
- **ReportLab**: PDF generation
- **Redis**: Caching (optional)
- **Celery**: Background task processing (optional)

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn UI**: Reusable UI components
- **Framer Motion**: Animation library
- **Zustand**: State management
- **Axios**: HTTP client
- **Recharts**: Charting library for analytics
- **React Dropzone**: File upload component

## Project Structure

```
ai-mcq-generator/
├── backend/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── models/           # Database models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   ├── utils/            # Utility functions
│   │   └── main.py           # FastAPI application
│   ├── alembic/              # Database migrations
│   ├── uploads/              # Uploaded files
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── landing/          # Landing page
│   │   ├── login/            # Login page
│   │   ├── register/         # Registration page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   └── ui/               # UI components
│   ├── lib/                  # Utilities
│   ├── store/                # Zustand stores
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis (optional, for caching)
- OpenAI API key or OpenRouter API key

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
 venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/ai_mcq_generator
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
REDIS_URL=redis://localhost:6379/0
```

5. Run database migrations:
```bash
alembic upgrade head
```

6. Start the backend server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Docker Setup

Using Docker Compose is the easiest way to run the entire application:

1. Ensure you have Docker and Docker Compose installed

2. Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your-openai-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
```

3. Run with Docker Compose:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 8000
- Frontend on port 3000

4. Run database migrations inside the backend container:
```bash
docker-compose exec backend alembic upgrade head
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Main API Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token
- `POST /api/auth/refresh` - Refresh JWT token

#### File Upload
- `POST /api/upload/upload` - Upload a document
- `POST /api/document/process/{file_id}` - Process uploaded document

#### Questions
- `POST /api/questions/generate` - Generate MCQs from document
- `GET /api/questions/file/{file_id}` - Get questions for a file

#### Quiz
- `POST /api/quiz/create` - Create a new quiz
- `POST /api/quiz/start` - Start a quiz
- `POST /api/quiz/submit` - Submit quiz answers
- `GET /api/quiz/attempts` - Get quiz attempts
- `GET /api/quiz/results/{attempt_id}` - Get quiz results

#### Analytics
- `GET /api/analytics/` - Get overall analytics
- `GET /api/analytics/performance-trends` - Get performance trends
- `GET /api/analytics/topic-performance` - Get topic-wise performance

#### Export
- `GET /api/export/quiz/{attempt_id}` - Export quiz results as PDF
- `GET /api/export/analytics` - Export analytics as PDF

## Usage

1. **Register**: Create an account on the registration page
2. **Login**: Sign in with your credentials
3. **Upload Document**: Upload a PDF, DOCX, or TXT file
4. **Process**: Process the document to extract text
5. **Generate Quiz**: Configure quiz settings and generate questions
6. **Take Quiz**: Answer the generated questions with the interactive quiz interface
7. **View Results**: See your score, detailed analysis, and AI suggestions
8. **Analytics**: Track your performance over time with charts and graphs

## Development

### Backend Development

- Run tests: `pytest`
- Run with auto-reload: `uvicorn app.main:app --reload`
- Create migration: `alembic revision --autogenerate -m "description"`
- Apply migration: `alembic upgrade head`

### Frontend Development

- Run development server: `npm run dev`
- Build for production: `npm run build`
- Run production build: `npm start`
- Run linter: `npm run lint`

## Deployment

### Backend Deployment (Railway/Render)

1. Push code to GitHub
2. Connect your repository to Railway/Render
3. Set environment variables in the deployment platform
4. Deploy

### Frontend Deployment (Vercel)

1. Push code to GitHub
2. Connect your repository to Vercel
3. Set `NEXT_PUBLIC_API_URL` environment variable
4. Deploy

## Environment Variables

### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Secret key for JWT token signing
- `OPENAI_API_KEY`: OpenAI API key (or use OpenRouter)
- `OPENROUTER_API_KEY`: OpenRouter API key (alternative to OpenAI)
- `REDIS_URL`: Redis connection string (optional)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL`: Backend API URL

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Verify database credentials

### File Upload Issues
- Check uploads directory permissions
- Ensure file size is under 10MB
- Verify file format (PDF, DOCX, TXT)

### AI Generation Issues
- Verify OpenAI/OpenRouter API key is valid
- Check API quota/credits
- Ensure document has sufficient text content

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.
