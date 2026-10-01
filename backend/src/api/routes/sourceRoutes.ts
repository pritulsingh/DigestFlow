import { Router, Request, Response, NextFunction } from 'express';
import { SourceDataService } from '../../services/sourceDataService.js';

export const sourceRouter = Router();
const sourceService = new SourceDataService();

/**
 * GET /signals
 * Query params: ?project=<id>
 */
sourceRouter.get('/signals', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { project } = req.query;
    if (typeof project === 'string' && project.trim().length > 0) {
      const signals = await sourceService.getSignalsByProject(project.trim());
      res.status(200).json(signals);
      return;
    }

    const signals = await sourceService.getAllSignals();
    res.status(200).json(signals);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /projects
 */
sourceRouter.get('/projects', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await sourceService.getAllProjects();
    res.status(200).json(projects);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /runs
 */
sourceRouter.get('/runs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { run } = req.query;
    if (typeof run === 'string' && !isNaN(parseInt(run, 10))) {
      const runNum = parseInt(run, 10);
      const runEntry = await sourceService.getRunByNumber(runNum);
      if (!runEntry) {
        res.status(404).json({ error: 'Run Log Not Found', run: runNum });
        return;
      }
      res.status(200).json(runEntry);
      return;
    }

    const runs = await sourceService.getAllRuns();
    res.status(200).json(runs);
  } catch (err) {
    next(err);
  }
});
