import { Router, Request, Response } from 'express';
import { authenticateAdmin, changePassword } from '../auth';
import { requireAdmin } from '../middleware';

const router = Router();

// Admin login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const token = await authenticateAdmin(username, password);
  
  if (!token) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ token });
});

// Change password (admin only)
router.post('/change-password', requireAdmin, async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const username = (req as any).username;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Old password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const success = await changePassword(username, oldPassword, newPassword);
  
  if (!success) {
    return res.status(401).json({ error: 'Invalid old password' });
  }

  res.json({ message: 'Password changed successfully' });
});

export default router;

