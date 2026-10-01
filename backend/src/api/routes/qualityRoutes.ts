import { Router, Request, Response, NextFunction } from 'express';
import { DataQualityService } from '../../services/dataQualityService.js';

export const qualityRouter = Router();
const qualityService = new DataQualityService();

/**
 * GET /data-quality
 * Returns all detected data quality issues across source fixtures.
 */
qualityRouter.get('/data-quality', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const issues = await qualityService.detectDataQualityIssues();
    res.status(200).json(issues);
  } catch (err) {
    next(err);
  }
});
