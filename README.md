# Guestbook Application

An embeddable guestbook web application built with TypeScript, Bun, and Express.js.

## Features

- Embeddable frontend widget that can be added to any website
- Admin dashboard for managing guestbook entries
- RESTful API for guestbook operations
- JWT-based admin authentication

## Setup

1. Install dependencies:
```bash
bun install
```

2. Run the development server:
```bash
bun run dev
```

The server will start on `http://localhost:3000`

## Embedding the Widget

Add this script tag to your website:

```html
<script src="http://localhost:3000/widget.js"></script>
<div id="guestbook-widget"></div>
```

## Admin Access

Default admin credentials:
- Username: `admin`
- Password: `admin123` (change this in production!)

Access the admin dashboard at: `http://localhost:3000/admin`

