import { Router, Request, Response } from 'express';
import { authenticateAdmin } from '../auth';

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

export default router;

