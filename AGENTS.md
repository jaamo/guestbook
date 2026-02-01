# AGENTS.md

This file provides context for AI assistants working with this codebase.

## Project Overview

A self-hosted, embeddable guestbook widget with admin approval workflow. Visitors can leave messages on websites, and admins approve/manage entries via a dashboard.

## Tech Stack

- **Runtime**: Bun
- **Backend**: Express.js + TypeScript (strict mode)
- **Database**: SQLite (via `bun:sqlite`)
- **Auth**: Custom JWT with HMAC-SHA256, bcryptjs for password hashing
- **Frontend**: Vanilla JavaScript (widget), inline HTML/CSS (admin dashboard)

## Project Structure

```
src/
├── index.ts           # Express app setup & routes
├── database.ts        # SQLite schema & initialization
├── auth.ts            # JWT & password management
├── middleware.ts      # requireAdmin middleware
└── routes/
    ├── guestbook.ts   # Guestbook CRUD endpoints
    └── auth.ts        # Login & password change
public/
├── widget.js          # Embeddable widget (IIFE)
├── admin.html         # Admin dashboard
└── demo.html          # Demo page
data/
└── guestbook.db       # SQLite database (gitignored)
```

## Commands

```bash
bun install            # Install dependencies
bun run dev            # Development mode
docker-compose up -d   # Production with Docker
```

## API Endpoints

**Public:**
- `GET /api/guestbook` - List approved entries (optional `?url=` filter)
- `POST /api/guestbook` - Submit new entry (unapproved by default)

**Admin (requires JWT):**
- `GET /api/guestbook/all` - All entries including pending
- `POST /api/guestbook/:id/approve` - Approve entry
- `DELETE /api/guestbook/:id` - Delete entry
- `POST /api/auth/login` - Get JWT token
- `POST /api/auth/change-password` - Change password

## Code Conventions

- **CSS classes**: Prefixed with `.gb-*` for widget, `.btn-*` for buttons
- **Error responses**: `{ error: "message" }` with appropriate HTTP status
- **Security**: Always use `escapeHtml()` for user content, prepared statements for SQL
- **Language**: Widget UI is in Finnish, admin dashboard in English

## Key Patterns

**Widget Integration:**
```html
<script src="https://your-domain.com/widget.js"></script>
<div id="guestbook-widget"></div>
```

**Authentication:**
- JWT tokens via `Authorization: Bearer <token>` header
- Tokens expire after 24 hours
- Default admin: `admin` / `admin123` (change in production)

**Database:**
- Auto-creates tables on first run
- Uses prepared statements for all queries
- Entries require approval before public display

## Important Notes

1. **Environment**: Requires `.env` with `JWT_SECRET` (must change from default in production)
2. **Database**: SQLite file at `data/guestbook.db` - back up regularly
3. **No test suite**: Manual testing via `/demo.html`
4. **Widget**: IIFE pattern, auto-initializes on `#guestbook-widget` element
5. **Docker**: Uses `oven/bun:latest`, health checks on `/api/guestbook`

## Security Considerations

- Change default `JWT_SECRET` before production
- Change default admin password after first deployment
- Use reverse proxy (nginx/Caddy) for SSL/TLS
- Widget has permissive CORS (by design for embedding)
