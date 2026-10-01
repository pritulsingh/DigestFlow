import { Router, Request, Response, NextFunction } from 'express';
import { WeeklyDigestService } from '../../services/weeklyDigestService.js';
import { LocalDraftProvider } from '../../services/draftProvider.js';
import { DraftManagementService } from '../../services/draftManagementService.js';

export const draftRouter = Router();
const digestService = new WeeklyDigestService();
const localDraftProvider = new LocalDraftProvider();
const draftManagementService = new DraftManagementService();

/**
 * POST /digests/draft
 * Generates an in-memory Draft object from WeeklyDigest facts.
 * Does NOT persist anything to disk.
 */
draftRouter.post('/digests/draft', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, tone } = req.body || {};
    const qFrom = (req.query.from as string) || from;
    const qTo = (req.query.to as string) || to;

    if (!qFrom || !qTo) {
      res.status(400).json({
        error: 'Bad Request',
        message: "Parameters 'from' and 'to' are required in YYYY-MM-DD format.",
      });
      return;
    }

    const digest = await digestService.generateDigestPreview(qFrom, qTo);
    const draft = await localDraftProvider.generateDraft(digest, { tone });

    res.status(200).json(draft);
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

/**
 * POST /digests/drafts or POST /drafts
 * Persists a new draft.
 */
const createDraftHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const draft = req.body;
    const actor = (req.headers['x-actor'] as string) || 'system';
    const created = await draftManagementService.createDraft(draft, actor);
    res.status(201).json(created);
  } catch (err: any) {
    if (err.message && (err.message.includes('Invalid') || err.message.includes('Missing'))) {
      res.status(400).json({ error: 'Bad Request', message: err.message });
      return;
    }
    next(err);
  }
};

draftRouter.post('/digests/drafts', createDraftHandler);
draftRouter.post('/drafts', createDraftHandler);

/**
 * GET /digests/drafts or GET /drafts
 * List all persisted drafts.
 */
const listDraftsHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const drafts = await draftManagementService.listDrafts();
    res.status(200).json(drafts);
  } catch (err) {
    next(err);
  }
};

draftRouter.get('/digests/drafts', listDraftsHandler);
draftRouter.get('/drafts', listDraftsHandler);

/**
 * GET /digests/drafts/:id or GET /drafts/:id
 * Retrieve a specific draft by ID.
 */
const getDraftHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const draft = await draftManagementService.getDraftById(req.params.id);
    if (!draft) {
      res.status(404).json({ error: 'Not Found', message: `Draft '${req.params.id}' not found.` });
      return;
    }
    res.status(200).json(draft);
  } catch (err) {
    next(err);
  }
};

draftRouter.get('/digests/drafts/:id', getDraftHandler);
draftRouter.get('/digests/draft/:id', getDraftHandler);
draftRouter.get('/drafts/:id', getDraftHandler);

/**
 * PUT /digests/drafts/:id or PUT /drafts/:id
 * Update an existing draft. Enforces state transitions & detector immutability.
 */
const updateDraftHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedDraft = req.body;
    if (updatedDraft.id && updatedDraft.id !== req.params.id) {
      res.status(400).json({ error: 'Bad Request', message: 'Route parameter ID does not match body ID.' });
      return;
    }
    updatedDraft.id = req.params.id;
    const actor = (req.headers['x-actor'] as string) || 'user';
    const saved = await draftManagementService.updateDraft(updatedDraft, actor);
    res.status(200).json(saved);
  } catch (err: any) {
    if (err.message && (err.message.includes('Invalid') || err.message.includes('not exist') || err.message.includes('Detector immutability violation'))) {
      res.status(400).json({ error: 'Bad Request', message: err.message });
      return;
    }
    next(err);
  }
};

draftRouter.put('/digests/drafts/:id', updateDraftHandler);
draftRouter.put('/digests/draft/:id', updateDraftHandler);
draftRouter.put('/drafts/:id', updateDraftHandler);

/**
 * POST /digests/drafts/:id/approve or POST /drafts/:id/approve
 * Human approval of a draft.
 */
const approveDraftHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = (req.headers['x-actor'] as string) || 'human-reviewer';
    const approved = await draftManagementService.approveDraft(req.params.id, actor);
    res.status(200).json(approved);
  } catch (err: any) {
    if (err.message && err.message.includes('not found')) {
      res.status(404).json({ error: 'Not Found', message: err.message });
      return;
    }
    next(err);
  }
};

draftRouter.post('/digests/drafts/:id/approve', approveDraftHandler);
draftRouter.post('/digests/draft/:id/approve', approveDraftHandler);
draftRouter.post('/drafts/:id/approve', approveDraftHandler);

/**
 * POST /digests/drafts/:id/publish or POST /drafts/:id/publish
 * Publishes an approved draft. Fails if not persisted or unapproved.
 */
const publishDraftHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const actor = (req.headers['x-actor'] as string) || 'publisher';
    const published = await draftManagementService.publishDraft(req.params.id, actor);
    res.status(200).json(published);
  } catch (err: any) {
    if (err.message && err.message.includes('not persisted')) {
      res.status(404).json({ error: 'Not Found', message: err.message });
      return;
    }
    if (err.message && err.message.includes('requires human approval')) {
      res.status(400).json({ error: 'Bad Request', message: err.message });
      return;
    }
    next(err);
  }
};

draftRouter.post('/digests/drafts/:id/publish', publishDraftHandler);
draftRouter.post('/digests/draft/:id/publish', publishDraftHandler);
draftRouter.post('/drafts/:id/publish', publishDraftHandler);

/**
 * GET /digests/published/:id or GET /published/:id
 * Retrieve a published digest by ID for read-only shareable view.
 */
const getPublishedDigestHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const publishedDraft = await draftManagementService.getPublishedDraft(req.params.id);
    res.status(200).json(publishedDraft);
  } catch (err: any) {
    if (err.message && err.message.includes('not found')) {
      res.status(404).json({ error: 'Not Found', message: err.message });
      return;
    }
    if (err.message && err.message.includes('has not been published yet')) {
      res.status(400).json({ error: 'Bad Request', message: err.message });
      return;
    }
    next(err);
  }
};

draftRouter.get('/digests/published/:id', getPublishedDigestHandler);
draftRouter.get('/published/:id', getPublishedDigestHandler);


