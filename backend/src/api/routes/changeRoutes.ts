import { Router, Request, Response, NextFunction } from 'express';
import { ChangedSinceLastWeekService } from '../../services/changedSinceLastWeekService.js';

export const changeRouter = Router();
const changeService = new ChangedSinceLastWeekService();

/**
 * GET /digests/changes?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Compares current period changes against previous comparable week.
 */
changeRouter.get('/digests/changes', async (req: Request, res: Response, next: NextFunction) => {
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

    const comparison = await changeService.compareWeeklyChanges(from, to);
    res.status(200).json(comparison);
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
