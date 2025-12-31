# Docker Deployment Guide

This guide explains how to run the Guestbook application in Docker for production.

## Prerequisites

- Docker installed on your system
- Docker Compose (optional, but recommended)

## Quick Start

### Using Docker Compose (Recommended)

1. **Set environment variables** (optional):

   ```bash
   export JWT_SECRET=your-secure-secret-key-here
   ```

2. **Build and run**:

   ```bash
   docker-compose up -d
   ```

3. **View logs**:

   ```bash
   docker-compose logs -f
   ```

4. **Stop the container**:
   ```bash
   docker-compose down
   ```

### Using Docker directly

1. **Build the image**:

   ```bash
   docker build -t guestbook .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     --name guestbook \
     -p 3000:3000 \
     -e JWT_SECRET=your-secure-secret-key-here \
     -e DB_PATH=/app/data \
     -v $(pwd)/data:/app/data \
     --restart unless-stopped \
     guestbook
   ```

## Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)
- `DB_PATH` - Path to store the database file (default: current directory)
- `NODE_ENV` - Set to `production` for production mode

### Volumes

The database file is stored in `./data/guestbook.db` and is persisted across container restarts.

## Production Considerations

1. **Change the JWT_SECRET**: Use a strong, random secret key in production:

   ```bash
   export JWT_SECRET=$(openssl rand -base64 32)
   ```

2. **Change default admin password**: After first run, log in to the admin panel and change the default password (admin/admin123).

3. **Use a reverse proxy**: In production, use nginx or similar to:

   - Handle SSL/TLS
   - Serve static files efficiently
   - Proxy API requests to the container

4. **Backup the database**: Regularly backup the `./data/guestbook.db` file.

## Health Check

The container includes a health check that verifies the API is responding. Check status with:

```bash
docker ps
```

## Troubleshooting

- **View logs**: `docker-compose logs guestbook`
- **Access container shell**: `docker exec -it guestbook sh`
- **Check database**: The database file is in `./data/guestbook.db`
