import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const BASE_DATA_DIR = path.resolve(__dirname, '../../../data');

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  env: process.env.NODE_ENV || 'development',
  apiPrefix: '/api/v1',
  fixtures: {
    signalLedger: path.join(BASE_DATA_DIR, 'signal-ledger.json'),
    config: path.join(BASE_DATA_DIR, 'config.json'),
    routingHints: path.join(BASE_DATA_DIR, 'routing-hints.json'),
    runLog: path.join(BASE_DATA_DIR, 'run-log.jsonl'),
    drafts: path.join(BASE_DATA_DIR, 'drafts.json'),
    auditLog: path.join(BASE_DATA_DIR, 'audit-log.jsonl'),
  },
};
