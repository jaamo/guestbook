import { Router, Request, Response } from 'express';
import { db, GuestbookEntry } from '../database';
import { requireAdmin } from '../middleware';

const router = Router();

// Get all approved entries
router.get('/', (req: Request, res: Response) => {
  const entries = db.prepare('SELECT * FROM entries WHERE approved = 1 ORDER BY created_at DESC').all() as GuestbookEntry[];
  res.json(entries);
});

// Get all entries (admin only)
router.get('/all', requireAdmin, (req: Request, res: Response) => {
  const entries = db.prepare('SELECT * FROM entries ORDER BY created_at DESC').all() as GuestbookEntry[];
  res.json(entries);
});

// Create new entry
router.post('/', (req: Request, res: Response) => {
  const { name, email, message, website } = req.body;

  if (!name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }

  try {
    const result = db
      .prepare('INSERT INTO entries (name, email, message, website, approved) VALUES (?, ?, ?, ?, ?)')
      .run(name, email || null, message, website || null, 0);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Entry submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create entry' });
  }
});

// Approve entry (admin only)
router.post('/:id/approve', requireAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  try {
    db.prepare('UPDATE entries SET approved = 1 WHERE id = ?').run(id);
    res.json({ message: 'Entry approved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve entry' });
  }
});

// Delete entry (admin only)
router.delete('/:id', requireAdmin, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  try {
    db.prepare('DELETE FROM entries WHERE id = ?').run(id);
    res.json({ message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

export default router;

