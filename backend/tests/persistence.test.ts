import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

import { DraftRepository } from '../src/repositories/draftRepository.js';
import { AuditRepository } from '../src/repositories/auditRepository.js';
import { FileStorage } from '../src/persistence/fileStorage.js';
import { FixtureParseError } from '../src/repositories/errors.js';
import { Draft, AuditEvent, WeeklyDigest } from '../src/domain/index.js';
import { config } from '../src/config/index.js';

function createSampleDigest(id: string): WeeklyDigest {
  return {
    id,
    title: `Weekly Digest ${id}`,
    weekIdentifier: '2026-W30',
    status: 'draft',
    sections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('Persistence Layer Test Suite', () => {
  describe('DraftRepository (drafts.json operations & restart simulation)', () => {
    it('DraftRepository - create, read, update, list, and published filter', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'draft-test-1-'));
      const draftsFile = path.join(tempDir, 'drafts.json');

      const repo = new DraftRepository(draftsFile);

      await repo.initialize();
      const initialDrafts = await repo.listDrafts();
      expect(initialDrafts.length).toBe(0);

      const sampleDraft: Draft = {
        id: 'draft-101',
        digestId: 'digest-101',
        version: 1,
        content: createSampleDigest('digest-101'),
        isApproved: false,
        createdById: 'local-test-user',
        createdAt: new Date().toISOString(),
      };

      const created = await repo.createDraft(sampleDraft);
      expect(created.id).toBe('draft-101');

      const retrieved = await repo.getDraftById('draft-101');
      expect(retrieved).toBeDefined();
      expect(retrieved?.digestId).toBe('digest-101');

      const updatedDraft: Draft = {
        ...sampleDraft,
        isApproved: true,
        content: {
          ...sampleDraft.content,
          status: 'published',
        },
      };

      await repo.updateDraft(updatedDraft);
      const reRetrieved = await repo.getDraftById('draft-101');
      expect(reRetrieved?.isApproved).toBe(true);
      expect(reRetrieved?.content.status).toBe('published');

      const published = await repo.getPublishedDrafts();
      expect(published.length).toBe(1);
      expect(published[0].id).toBe('draft-101');

      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('DraftRepository - Persistence across process restart simulation', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'draft-test-restart-'));
      const draftsFile = path.join(tempDir, 'drafts.json');

      const repoProcess1 = new DraftRepository(draftsFile);
      await repoProcess1.createDraft({
        id: 'draft-restart-1',
        digestId: 'digest-restart-1',
        version: 1,
        content: createSampleDigest('digest-restart-1'),
        isApproved: true,
        createdById: 'user-p1',
        createdAt: new Date().toISOString(),
      });

      const repoProcess2 = new DraftRepository(draftsFile);
      const loadedDrafts = await repoProcess2.listDrafts();

      expect(loadedDrafts.length).toBe(1);
      expect(loadedDrafts[0].id).toBe('draft-restart-1');
      expect(loadedDrafts[0].createdById).toBe('user-p1');

      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('DraftRepository - Throws FixtureParseError on malformed persisted file', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'draft-test-malformed-'));
      const malformedFile = path.join(tempDir, 'drafts.json');

      await fs.writeFile(malformedFile, '[{ invalid json data: true');

      const repo = new DraftRepository(malformedFile);
      await expect(repo.listDrafts()).rejects.toThrow(FixtureParseError);

      await fs.rm(tempDir, { recursive: true, force: true });
    });
  });

  describe('AuditRepository (audit-log.jsonl operations)', () => {
    it('AuditRepository - append audit events and read events', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audit-test-1-'));
      const auditFile = path.join(tempDir, 'audit-log.jsonl');

      const repo = new AuditRepository(auditFile);
      await repo.initialize();

      const event1: AuditEvent = {
        id: 'audit-001',
        eventType: 'DRAFT_CREATED',
        actor: 'user-admin',
        timestamp: new Date().toISOString(),
        details: { draftId: 'draft-101' },
      };

      const event2: AuditEvent = {
        id: 'audit-002',
        eventType: 'DRAFT_APPROVED',
        actor: 'user-reviewer',
        timestamp: new Date().toISOString(),
        details: { draftId: 'draft-101' },
      };

      await repo.appendEvent(event1);
      await repo.appendEvent(event2);

      const events = await repo.getEvents();
      expect(events.length).toBe(2);
      expect(events[0].id).toBe('audit-001');
      expect(events[1].id).toBe('audit-002');
      expect(events[1].actor).toBe('user-reviewer');

      await fs.rm(tempDir, { recursive: true, force: true });
    });
  });

  describe('Atomic Writes & Path Safety', () => {
    it('FileStorage - Atomic file write safety during failed writes', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'atomic-write-test-'));
      const targetFile = path.join(tempDir, 'data.json');

      await FileStorage.writeJsonAtomic(targetFile, { initial: true });
      const initialContent = await fs.readFile(targetFile, 'utf-8');
      expect(initialContent).toContain('initial');

      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj;

      await expect(FileStorage.writeJsonAtomic(targetFile, circularObj)).rejects.toThrow();

      const afterFailedWriteContent = await fs.readFile(targetFile, 'utf-8');
      expect(afterFailedWriteContent).toBe(initialContent);

      const files = await fs.readdir(tempDir);
      expect(files).toEqual(['data.json']);

      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('Rejects write operations targeting protected source fixture files', async () => {
      const fixturePath = path.resolve(process.cwd(), 'data/signal-ledger.json');
      await expect(FileStorage.writeJsonAtomic(fixturePath, { malicious: 'overwrite' })).rejects.toThrow(
        'outside permitted data directory'
      );
    });

    it('Path traversal attempts outside application data directory are rejected', async () => {
      const maliciousPath = path.resolve(process.cwd(), 'data/../../etc/passwd');
      await expect(FileStorage.writeJsonAtomic(maliciousPath, { malicious: true })).rejects.toThrow(
        'outside permitted data directory'
      );
    });
  });

  describe('Source Fixture Immutability Check', () => {
    it('Source fixture files remain 100% byte-for-byte read-only', () => {
      function getFileHash(filePath: string): string {
        const fileBuffer = fsSync.readFileSync(filePath);
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
      }

      expect(getFileHash(config.fixtures.signalLedger)).toBe(
        '3bcb61518d23dde6a6c6c2704de3d5def2d13e118f5d52be0da8ce6087f3d546'
      );
      expect(getFileHash(config.fixtures.config)).toBe(
        'be3cbecc79e39a4da7795afd172e98081f97632f2b8292f04eddada8dea71719'
      );
      expect(getFileHash(config.fixtures.routingHints)).toBe(
        '733957eaa51ab53b69e8a8fe5f2fad2a6918285365a8834ee83ffe6bbad3c821'
      );
      expect(getFileHash(config.fixtures.runLog)).toBe(
        'b936635631c0551c8c4ffc55f022f792f5539ffd1ce9ab02b7cb83a702bcb90e'
      );
    });
  });
});
