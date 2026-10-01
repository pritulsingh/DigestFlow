export class RepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RepositoryError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class FixtureNotFoundError extends RepositoryError {
  public readonly filePath: string;

  constructor(filePath: string) {
    super(`Fixture file not found at path: '${filePath}'`);
    this.name = 'FixtureNotFoundError';
    this.filePath = filePath;
  }
}

export class FixtureParseError extends RepositoryError {
  public readonly filePath: string;
  public readonly rawError: string;

  constructor(filePath: string, rawError: string) {
    super(`Failed to parse fixture file at '${filePath}': ${rawError}`);
    this.name = 'FixtureParseError';
    this.filePath = filePath;
    this.rawError = rawError;
  }
}

export class FixtureValidationError extends RepositoryError {
  public readonly filePath: string;
  public readonly validationDetails: string;

  constructor(filePath: string, validationDetails: string) {
    super(`Fixture file at '${filePath}' failed validation: ${validationDetails}`);
    this.name = 'FixtureValidationError';
    this.filePath = filePath;
    this.validationDetails = validationDetails;
  }
}
