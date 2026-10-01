import { Router, Request, Response, NextFunction } from 'express';
import { HealthService } from '../../services/healthService.js';

export const healthRouter = Router();

healthRouter.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const health = HealthService.getHealth();
    res.status(200).json(health);
  } catch (err) {
    next(err);
  }
});

healthRouter.get('/system-info', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const systemInfo = await HealthService.getSystemInfo();
    res.status(200).json(systemInfo);
  } catch (err) {
    next(err);
  }
});
