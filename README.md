# FeedPulse

AI-powered product feedback platform built with Next.js, Node.js/Express, TypeScript, and MongoDB.

---

## Getting Started (local development)

### Prerequisites
- Node.js 20+
- MongoDB running locally on port 27017

### Backend

```bash
cd backend
cp .env.example .env   # fill in GEMINI_API_KEY, JWT_SECRET, etc.
npm install
npm run dev            # ts-node-dev with hot reload on :3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # Next.js dev server on :3001
```

---

## Running with Docker

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed

### Steps

1. **Copy the env template and fill in your secrets:**
   ```bash
   cp .env.example .env
   # Edit .env — set GEMINI_API_KEY and JWT_SECRET at minimum
   ```

2. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```
   This starts MongoDB, the backend API, and the Next.js frontend.

3. **Open the app:**
   - Public feedback form → <http://localhost:3001>
   - Admin dashboard → <http://localhost:3001/dashboard>
   - Backend API → <http://localhost:3000>

### Stopping

```bash
docker-compose down          # stop containers, keep the DB volume
docker-compose down -v       # stop containers AND wipe the database volume
```

### Rebuilding after code changes

```bash
docker-compose up --build    # rebuilds changed images, then restarts
```
