import { Database } from 'bun:sqlite';
import { hash } from 'bcryptjs';

const db = new Database('guestbook.db');

// Initialize database tables
export async function initDatabase() {
  // Guestbook entries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      message TEXT NOT NULL,
      website TEXT,
      page_title TEXT,
      page_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved INTEGER DEFAULT 0
    )
  `);

  // Add new columns if they don't exist (for existing databases)
  try {
    db.exec('ALTER TABLE entries ADD COLUMN page_title TEXT');
  } catch (e) {
    // Column already exists, ignore
  }
  try {
    db.exec('ALTER TABLE entries ADD COLUMN page_url TEXT');
  } catch (e) {
    // Column already exists, ignore
  }

  // Admin users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create default admin if none exists
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number };
  if (adminCount.count === 0) {
    const passwordHash = await hash('admin123', 10);
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', passwordHash);
    console.log('Default admin created: username=admin, password=admin123');
  }
}

export interface GuestbookEntry {
  id: number;
  name: string;
  email: string | null;
  message: string;
  website: string | null;
  page_title: string | null;
  page_url: string | null;
  created_at: string;
  approved: number;
}

export { db };

