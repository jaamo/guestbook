import { Request, Response, NextFunction } from 'express';
import { isAdmin } from './auth';

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
  
  if (!(await isAdmin(token))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

