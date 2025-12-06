# 🔄 Docker Template Guide - Reuse for Other Projects

This guide shows how to adapt the RetentionOS Docker setup for other projects on your desktop.

## 📁 Project Structure

When setting up Docker for a new project, follow this structure:

```
YourProject/
├── docker-compose.yml          # Main compose file
├── docker-compose.prod.yml     # Production compose (optional)
├── .env                        # Environment variables (gitignored)
├── .env.example               # Template for .env
├── docker-start.sh            # Helper script
├── docker-stop.sh             # Helper script
├── docker-logs.sh             # Helper script
├── docker-status.sh           # Helper script
├── backend/                   # Your backend service
│   └── Dockerfile
├── frontend/                   # Your frontend service (optional)
│   └── Dockerfile
└── infra/                      # Infrastructure configs
    └── environment/
        └── dev.env.example
```

## 🔧 Step-by-Step: Adapting for New Project

### Step 1: Copy Base Files

From RetentionOS, copy these files to your new project:

```bash
# Essential files
cp docker-compose.yml /path/to/newproject/
cp docker-start.sh /path/to/newproject/
cp docker-stop.sh /path/to/newproject/
cp docker-logs.sh /path/to/newproject/
cp docker-status.sh /path/to/newproject/
```

### Step 2: Update Project Names

**In `docker-compose.yml`**, replace all `retentionos` references:

```yaml
# Find and replace:
retentionos-backend  →  yourproject-backend
retentionos-dashboard → yourproject-frontend
retentionos-db       →  yourproject-db
retentionos-redis    →  yourproject-redis
retentionos-network  →  yourproject-network
retentionos_db_data  →  yourproject_db_data
```

### Step 3: Update Ports (if needed)

```yaml
services:
  backend:
    ports:
      - "3000:3000"  # Change if port 3000 is used
      
  frontend:
    ports:
      - "3001:3001"  # Change if port 3001 is used
```

### Step 4: Adjust Services for Your Stack

#### For Node.js Projects (Same as RetentionOS)
✅ Already configured - just update paths

#### For Python Projects
```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  # Python-specific environment
  environment:
    - PYTHONUNBUFFERED=1
    - FLASK_APP=app.py
```

#### For PHP Projects
```yaml
backend:
  image: php:8.2-fpm
  volumes:
    - ./backend:/var/www/html
```

#### For Different Databases

**PostgreSQL:**
```yaml
db:
  image: postgres:15-alpine
  environment:
    - POSTGRES_DB=${DB_NAME}
    - POSTGRES_USER=${DB_USER}
    - POSTGRES_PASSWORD=${DB_PASSWORD}
```

**MongoDB:**
```yaml
db:
  image: mongo:7
  environment:
    - MONGO_INITDB_DATABASE=${DB_NAME}
  volumes:
    - db_data:/data/db
```

### Step 5: Create Dockerfiles

#### Backend Dockerfile (Node.js)
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

#### Backend Dockerfile (Python)
```dockerfile
FROM python:3.11-alpine

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["python", "app.py"]
```

### Step 6: Update Environment Variables

Create `.env.example`:

```env
# Database
DB_NAME=yourproject_dev
DB_USER=yourproject
DB_PASSWORD=your_secure_password
DB_ROOT_PASSWORD=your_root_password

# Application
NODE_ENV=development
PORT=3000

# Add your project-specific variables
API_KEY=your_api_key
SECRET_KEY=your_secret_key
```

### Step 7: Update Helper Scripts

In `docker-start.sh`, update service URLs:

```bash
echo "Services available at:"
echo "  📊 Backend API:    http://localhost:3000"
echo "  🎨 Frontend:       http://localhost:3001"
# Update with your actual services
```

## 🎯 Common Project Types

### Full-Stack Web App (Like RetentionOS)
- ✅ Backend (Node.js/Python/PHP)
- ✅ Frontend (React/Next.js/Vue)
- ✅ Database (MySQL/PostgreSQL)
- ✅ Redis (optional)

### API-Only Project
```yaml
services:
  api:
    # Your API service
  db:
    # Database
```

### Static Website
```yaml
services:
  nginx:
    image: nginx:alpine
    volumes:
      - ./dist:/usr/share/nginx/html
    ports:
      - "80:80"
```

### Microservices
```yaml
services:
  auth-service:
    # Authentication service
  user-service:
    # User management
  api-gateway:
    # API gateway
```

## 📝 Quick Checklist

When adapting for a new project:

- [ ] Copy `docker-compose.yml`
- [ ] Replace all `retentionos` with project name
- [ ] Update ports if needed
- [ ] Adjust services for your stack
- [ ] Create Dockerfiles for each service
- [ ] Create `.env.example` file
- [ ] Update helper scripts
- [ ] Test with `docker-compose up -d`
- [ ] Verify all services start correctly

## 🔍 Example: Simple Blog Project

```yaml
version: '3.8'

services:
  blog-api:
    build: ./api
    container_name: blog-api
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=db
      - DB_NAME=blog_db
    depends_on:
      - db

  blog-frontend:
    build: ./frontend
    container_name: blog-frontend
    ports:
      - "3001:3001"
    depends_on:
      - blog-api

  db:
    image: postgres:15-alpine
    container_name: blog-db
    environment:
      - POSTGRES_DB=blog_db
      - POSTGRES_USER=blog_user
      - POSTGRES_PASSWORD=password
    volumes:
      - blog_db_data:/var/lib/postgresql/data

volumes:
  blog_db_data:

networks:
  default:
    name: blog-network
```

## 💡 Pro Tips

1. **Use named volumes** for data persistence
2. **Use health checks** for service dependencies
3. **Keep Dockerfiles simple** - optimize later
4. **Use .env files** for configuration
5. **Document your setup** in README.md
6. **Version control** docker-compose.yml but not .env

## 🚀 Quick Start Template

Save this as `docker-quickstart.sh`:

```bash
#!/bin/bash
PROJECT_NAME=${1:-"myproject"}

echo "Creating Docker setup for: $PROJECT_NAME"

# Create docker-compose.yml from template
cat > docker-compose.yml << EOF
version: '3.8'
services:
  ${PROJECT_NAME}-backend:
    build: ./backend
    ports:
      - "3000:3000"
  ${PROJECT_NAME}-db:
    image: mariadb:10.11
    environment:
      - MYSQL_DATABASE=${PROJECT_NAME}_dev
    volumes:
      - ${PROJECT_NAME}_db_data:/var/lib/mysql
volumes:
  ${PROJECT_NAME}_db_data:
EOF

echo "✅ Created docker-compose.yml"
echo "Next: Create Dockerfiles and .env file"
```

---

**Remember**: Start simple, add complexity as needed. The RetentionOS setup is comprehensive - you may not need all services for every project!

