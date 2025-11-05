# Quick Start Guide - Docker Development

## Prerequisites
- Docker Desktop installed (or Docker + Docker Compose on Linux)
- Git
- Code editor (VS Code recommended)

## First Time Setup

### 1. Clone and Configure

```bash
# Clone repository
git clone https://github.com/your-org/neurmatic.git
cd neurmatic

# Copy environment files
cp .env.example .env

# Edit .env with your settings (optional for local dev)
nano .env
```

### 2. Start Development Environment

```bash
# Start all services
docker compose up -d

# Wait for services to be healthy (about 30 seconds)
docker compose ps

# View logs (optional)
docker compose logs -f
```

### 3. Initialize Database

```bash
# Run database migrations
docker compose exec backend npx prisma migrate deploy

# (Optional) Seed database with sample data
docker compose exec backend npx prisma seed
```

### 4. Verify Setup

Open in your browser:
- **Frontend**: http://vps-1a707765.vps.ovh.net:5173
- **Backend API**: http://vps-1a707765.vps.ovh.net:3000/api/v1/health
- **Database GUI**: Run `docker compose exec backend npx prisma studio` then visit http://localhost:5555

## Daily Development Workflow

### Start Work Session
```bash
# Start services (if not running)
docker compose up -d

# Check status
docker compose ps
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Make Code Changes
- Edit files in `backend/src/` or `frontend/src/`
- Changes are automatically reloaded (hot reload enabled)
- Backend: Nodemon restarts on file changes
- Frontend: Vite HMR updates browser automatically

### Database Changes
```bash
# View database GUI
docker compose exec backend npx prisma studio

# Create new migration
docker compose exec backend npx prisma migrate dev --name description_of_change

# Reset database (CAUTION: deletes all data)
docker compose exec backend npx prisma migrate reset
```

### Run Tests
```bash
# Backend tests
docker compose exec backend npm test

# Frontend tests
docker compose exec frontend npm test
```

### End Work Session
```bash
# Stop services (keeps data)
docker compose stop

# Or stop and remove containers (keeps volumes/data)
docker compose down
```

## Common Commands

### Service Management
```bash
# Start services
docker compose up -d

# Stop services
docker compose stop

# Restart a service
docker compose restart backend

# View service status
docker compose ps

# View resource usage
docker stats
```

### Logs and Debugging
```bash
# Follow logs for all services
docker compose logs -f

# Follow logs for specific service
docker compose logs -f backend

# View last 100 lines
docker compose logs --tail=100 backend

# Search logs
docker compose logs backend | grep "Error"
```

### Execute Commands in Containers
```bash
# Backend commands
docker compose exec backend npm run lint
docker compose exec backend npm run test
docker compose exec backend npx prisma studio

# Frontend commands
docker compose exec frontend npm run lint
docker compose exec frontend npm run type-check

# Shell access
docker compose exec backend sh
docker compose exec frontend sh
```

### Cleanup
```bash
# Remove stopped containers
docker compose rm

# Remove containers and volumes (DELETES DATA)
docker compose down -v

# Remove unused images
docker image prune -a

# Full cleanup (CAUTION)
docker system prune -a --volumes
```

## Troubleshooting

### Services Won't Start
```bash
# Check if ports are in use
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# View detailed error logs
docker compose logs backend
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check database logs
docker compose logs postgres

# Restart database
docker compose restart postgres
```

### Hot Reload Not Working
```bash
# Rebuild containers
docker compose up -d --build

# Check file permissions (Linux)
ls -la backend/src
ls -la frontend/src
```

### Port Already in Use
```bash
# Option 1: Stop conflicting service
# Option 2: Edit docker-compose.yml ports (e.g., 3001:3000)
```

### Out of Disk Space
```bash
# Remove unused images and volumes
docker system prune -a --volumes

# Check disk usage
docker system df
```

### Container Keeps Restarting
```bash
# Check logs for errors
docker compose logs --tail=50 backend

# Check health status
docker compose ps

# Inspect container
docker inspect neurmatic-backend
```

## Performance Tips

### Speed Up Builds
- Use `.dockerignore` to exclude unnecessary files (already configured)
- Don't run `npm install` locally (use Docker volumes)

### Reduce Memory Usage
```bash
# Limit container resources in docker-compose.yml
# Add under service definition:
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
```

### Database Performance
- Keep volumes on fast storage (SSD)
- Increase shared_buffers if needed
- Run `VACUUM` periodically in production

## Environment Variables

### Required Variables
See `.env.example` for all available variables.

**Minimum for local development** (already set in docker-compose.yml):
- ✅ NODE_ENV=development
- ✅ DATABASE_URL (auto-configured)
- ✅ REDIS_URL (auto-configured)
- ✅ JWT_SECRET (default provided)

**Optional Services**:
- SENTRY_DSN (error tracking)
- GOOGLE_CLIENT_ID (OAuth)
- SENDGRID_API_KEY (emails)
- AWS credentials (S3 storage)

## IDE Integration

### VS Code
Install extensions:
- Docker (Microsoft)
- Prisma (Prisma)
- ESLint (Microsoft)
- TypeScript (Microsoft)

Access container terminal:
1. Open Docker extension
2. Right-click container → Attach Shell

### Debugging in Docker
Backend debugging:
```yaml
# Add to backend service in docker-compose.yml
ports:
  - "3000:3000"
  - "9229:9229"  # Debug port
command: node --inspect=0.0.0.0:9229 -r ts-node/register src/server.ts
```

## Useful Aliases (Optional)

Add to your `.bashrc` or `.zshrc`:
```bash
alias dc='docker compose'
alias dcu='docker compose up -d'
alias dcd='docker compose down'
alias dcl='docker compose logs -f'
alias dcp='docker compose ps'
alias dcr='docker compose restart'
```

Then use:
```bash
dcu     # Start services
dcl     # View logs
dcp     # View status
dcd     # Stop services
```

## Production Deployment

For production deployment, see:
- `README.md` - CI/CD Pipeline section
- `.github/workflows/deploy-production.yml` - Deployment workflow
- `SPRINT-0-INFRASTRUCTURE-SUMMARY.md` - Complete infrastructure guide

**Never use docker-compose.yml for production** - It's configured for development with hot reload and exposed debug ports.

## Getting Help

1. **Check logs first**: `docker compose logs -f`
2. **Review this guide**: Most common issues covered above
3. **Check main README**: `README.md`
4. **Infrastructure docs**: `SPRINT-0-INFRASTRUCTURE-SUMMARY.md`
5. **Ask team**: If issue persists

## Health Checks

All services include health checks:
- **PostgreSQL**: Checks `pg_isready`
- **Redis**: Checks `redis-cli ping`
- **Backend**: Checks `/api/v1/health` endpoint
- **Frontend**: Checks HTTP 200 response

Unhealthy containers automatically restart.

---

**Quick Reference**:
- Start: `docker compose up -d`
- Logs: `docker compose logs -f`
- Stop: `docker compose down`
- Database: `docker compose exec backend npx prisma studio`

**Happy coding!** 🚀
