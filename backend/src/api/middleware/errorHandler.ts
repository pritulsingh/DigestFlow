import { Request, Response, NextFunction } from 'express';
import {
  FixtureNotFoundError,
  FixtureParseError,
  FixtureValidationError,
  RepositoryError,
} from '../../repositories/errors.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error Middleware]:', err);

  if (err instanceof FixtureNotFoundError) {
    res.status(404).json({
      error: 'Fixture Not Found',
      message: err.message,
      filePath: err.filePath,
    });
    return;
  }

  if (err instanceof FixtureValidationError) {
    res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.validationDetails,
    });
    return;
  }

  if (err instanceof FixtureParseError) {
    res.status(500).json({
      error: 'Parse Error',
      message: err.message,
      rawError: err.rawError,
    });
    return;
  }

  if (err instanceof RepositoryError) {
    res.status(500).json({
      error: 'Repository Error',
      message: err.message,
    });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
  });
}
