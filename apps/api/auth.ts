import type { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  req.userId = userId as string;
  next();
};