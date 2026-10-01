import { Router, Request, Response, NextFunction } from 'express';
import { WeeklyDigestService } from '../../services/weeklyDigestService.js';

export const digestRouter = Router();
const digestService = new WeeklyDigestService();

/**
 * GET /digests/preview?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Non-persisted preview endpoint for generating WeeklyDigest in memory.
 */
digestRouter.get('/digests/preview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!from || !to) {
      res.status(400).json({
        error: 'Bad Request',
        message: "Query parameters 'from' and 'to' are required in YYYY-MM-DD format.",
      });
      return;
    }

    const digestPreview = await digestService.generateDigestPreview(from, to);
    res.status(200).json(digestPreview);
  } catch (err: any) {
    if (err.message && err.message.includes('Invalid')) {
      res.status(400).json({
        error: 'Bad Request',
        message: err.message,
      });
      return;
    }
    next(err);
  }
});
