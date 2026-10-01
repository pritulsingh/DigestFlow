import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

import { SignalRepository } from '../src/repositories/signalRepository.js';
import { ConfigRepository } from '../src/repositories/configRepository.js';
import { RoutingRepository } from '../src/repositories/routingRepository.js';
import { RunLogRepository } from '../src/repositories/runLogRepository.js';
import {
  FixtureNotFoundError,
  FixtureParseError,
  FixtureValidationError,
} from '../src/repositories/errors.js';
import { config } from '../src/config/index.js';

describe('Repository Layer Test Suite', () => {
  describe('Fixture Loading & Correct File Selection', () => {
    it('SignalRepository reads and parses signal-ledger.json correctly', async () => {
      const repo = new SignalRepository();
      const container = await repo.getContainer();
      const signals = await repo.getSignals();

      expect(container.version).toBe(4);
      expect(signals.length).toBe(77);

      const sampleSignal = container.signals[0];
      expect(sampleSignal.id).toBe('2026-07-06_atlas_permit_intake');
      expect(sampleSignal.type).toBe('meeting');
      expect(Array.isArray(sampleSignal.attendees)).toBe(true);
      expect(Array.isArray(sampleSignal.projects)).toBe(true);

      const northwindSignals = await repo.findByProject('northwind');
      expect(northwindSignals.length).toBe(12);
    });

    it('ConfigRepository reads and parses config.json correctly', async () => {
      const repo = new ConfigRepository();
      const sysConfig = await repo.getConfig();
      const projects = await repo.getProjects();

      expect(projects.length).toBe(5);
      const projectIds = projects.map((p) => p.id);
      expect(projectIds).toEqual(['northwind', 'harborline', 'quill', 'atlas', 'studio_ops']);
      expect(sysConfig.fallbacks.unrouted).toBe('internal_unsorted');

      const atlasProject = await repo.findProjectById('atlas');
      expect(atlasProject).toBeDefined();
      expect(atlasProject?.name).toBe('Atlas Permits');
    });

    it('RoutingRepository reads and parses routing-hints.json correctly', async () => {
      const repo = new RoutingRepository();
      const hints = await repo.getHints();

      expect(hints.length).toBe(3);
      expect(hints[0].type).toBe('keyword');
      expect(hints[0].match).toBe('manifest');

      const typoHint = hints.find((h) => h.project === 'quil');
      expect(typoHint).toBeDefined();
    });

    it('RunLogRepository reads and parses run-log.jsonl correctly', async () => {
      const repo = new RunLogRepository();
      const entries = await repo.getRuns();

      expect(entries.length).toBe(45);
      const run100 = await repo.findByRunNumber(100);
      expect(run100).toBeDefined();
      expect(run100?.status).toBe('ok');

      const failedEntries = entries.filter((e) => e.status === 'fail');
      expect(failedEntries.length).toBe(2);
    });
  });

  describe('Fixture Immutability & Safety', () => {
    it('Source fixture files remain byte-for-byte unchanged (SHA-256 baseline verification)', () => {
      function getFileHash(filePath: string): string {
        const fileBuffer = fsSync.readFileSync(filePath);
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
      }

      const signalLedgerHash = getFileHash(config.fixtures.signalLedger);
      const configHash = getFileHash(config.fixtures.config);
      const routingHintsHash = getFileHash(config.fixtures.routingHints);
      const runLogHash = getFileHash(config.fixtures.runLog);

      expect(signalLedgerHash).toBe('3bcb61518d23dde6a6c6c2704de3d5def2d13e118f5d52be0da8ce6087f3d546');
      expect(configHash).toBe('be3cbecc79e39a4da7795afd172e98081f97632f2b8292f04eddada8dea71719');
      expect(routingHintsHash).toBe('733957eaa51ab53b69e8a8fe5f2fad2a6918285365a8834ee83ffe6bbad3c821');
      expect(runLogHash).toBe('b936635631c0551c8c4ffc55f022f792f5539ffd1ce9ab02b7cb83a702bcb90e');
    });

    it('Repositories possess NO write or mutation methods', () => {
      const signalRepoMethods = Object.getOwnPropertyNames(SignalRepository.prototype);
      const configRepoMethods = Object.getOwnPropertyNames(ConfigRepository.prototype);
      const routingRepoMethods = Object.getOwnPropertyNames(RoutingRepository.prototype);
      const runLogRepoMethods = Object.getOwnPropertyNames(RunLogRepository.prototype);

      const forbiddenPrefixes = ['write', 'save', 'update', 'delete', 'put', 'post', 'mutate', 'create'];

      for (const methods of [signalRepoMethods, configRepoMethods, routingRepoMethods, runLogRepoMethods]) {
        for (const method of methods) {
          for (const forbidden of forbiddenPrefixes) {
            expect(method.toLowerCase().startsWith(forbidden)).toBe(false);
          }
        }
      }
    });
  });

  describe('Malformed Source Handling', () => {
    it('Repositories throw FixtureNotFoundError when file path does not exist', async () => {
      const badPath = path.join(os.tmpdir(), 'non_existent_fixture_' + Date.now() + '.json');
      const repo = new SignalRepository(badPath);

      await expect(repo.getSignals()).rejects.toThrow(FixtureNotFoundError);
    });

    it('Repositories throw FixtureParseError when file contains invalid JSON', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-test-parse-'));
      const malformedFile = path.join(tempDir, 'malformed.json');
      await fs.writeFile(malformedFile, '{ invalid json content: 123 }');

      const repo = new ConfigRepository(malformedFile);
      await expect(repo.getConfig()).rejects.toThrow(FixtureParseError);

      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('Repositories throw FixtureValidationError when file structure is invalid', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-test-valid-'));
      const invalidFile = path.join(tempDir, 'invalid_structure.json');
      await fs.writeFile(invalidFile, JSON.stringify({ wrongKey: true }));

      const repo = new SignalRepository(invalidFile);
      await expect(repo.getContainer()).rejects.toThrow(FixtureValidationError);

      await fs.rm(tempDir, { recursive: true, force: true });
    });
  });
});
