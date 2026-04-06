# VehraDevLytics

VehraDevLytics is a GitHub analytics dashboard focused on pull request flow, review speed, and workflow bottlenecks.

## Tech Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma
- Queue / background jobs: BullMQ
- Redis: local Redis instance (WSL recommended on Windows)
- GitHub integrations:
  - GitHub App for repository/webhook access
  - GitHub OAuth App for login

## Local Demo Setup

### 1. Clone the repository
```bash
git clone https://github.com/ZohaibVehra/VehraDevLytics.git
cd VehraDevLytics
```

### 2. Install dependencies

From Root
```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Set up local PostgreSQL database with Prisma
If docker installed:
```bash
docker run --name devlytics-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=DevLytics \
  -p 5432:5432 \
  -d postgres
```

If PostgreSQL already installed 
1. open psql or pgAdmin
2. create a database
```CREATE DATABASE "DevLytics";```

### 4. Set up local Redis

If on Windows 

1. Install WSL 
```wsl --install```

2. Open Ubuntu (WSL terminal)

3. Install Redis
```sudo apt update```
```sudo apt install redis-server```

4. Start Redis
```redis-server```

5. Verify Redis working
```redis-cli ping ```
Expected output:
```PONG```


### 5. Create environment variables
create a .env file in the backend folder or rename the sampleEnv file to .env
For demo purposes relevant credentials will be provided separately.
Provide database url for DATABASE_URL, example DATABASE_URL="postgresql://postgres:postgres@localhost:5432/DevLytics?schema=public"

### 6. Set up Prisma

From the backend folder:

```bash
cd backend
npm run db:push
npm run db:generate
```

To verify correct setup:

```bash
npm run db:studio
```


### 7. Start VehraDevLytics
Each in its own process 

From backend
```bash
smee -u https://smee.io/3cIL2mV13Nascey --target http://localhost:3000/webhook
```
From backend
```bash
npx tsx worker.ts
```


From backend
```bash
npm run dev
```

From Frontend
```bash
npm run dev
```

If Redis or PostgreSQL are not running, the backend will fail or jobs will not process.

### 8. Utilize VehraDevLytics
1. Open http://localhost:5173  
2. Click "Install GitHub App" (if not already installed) and install on relevant repositories
3. Click "Login with GitHub"  
4. Select a repository  
5. Click Create Repo Metrics button at the bottom of page (local design only)
5. As metrics are updated after a certain number of events, if you want to view recent event included metrics quickly click 'Create Repo Metrics' button at the bottom of the dashboard
