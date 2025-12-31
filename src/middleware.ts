import { Request, Response, NextFunction } from 'express';
import { isAdmin, verifyToken } from './auth';

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
  
  if (!(await isAdmin(token))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Attach username to request for convenience
  if (token) {
    const decoded = await verifyToken(token);
    if (decoded) {
      (req as any).username = decoded.username;
    }
  }
  
  next();
}

