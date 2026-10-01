import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';

describe('API Integration Test Suite (Supertest)', () => {
  describe('Health Endpoint', () => {
    it('GET /api/health returns 200 OK with health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('Weekly Digest Composer API');
    });

    it('GET /api/v1/health returns 200 OK with versioned prefix', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('Source Data Endpoints (Signals, Projects, Runs)', () => {
    it('GET /api/signals returns 200 OK with all 77 signals', async () => {
      const res = await request(app).get('/api/signals');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(77);
    });

    it('GET /api/signals?project=northwind returns filtered signals', async () => {
      const res = await request(app).get('/api/signals?project=northwind');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(12);
    });

    it('GET /api/projects returns 200 OK with 5 projects', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(5);
    });

    it('GET /api/runs returns 200 OK with 45 run logs', async () => {
      const res = await request(app).get('/api/runs');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(45);
    });

    it('GET /api/runs?run=100 returns run entry #100', async () => {
      const res = await request(app).get('/api/runs?run=100');
      expect(res.status).toBe(200);
      expect(res.body.run).toBe(100);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Data Quality Endpoint', () => {
    it('GET /api/data-quality returns 200 OK with detected issues array', async () => {
      const res = await request(app).get('/api/data-quality');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);

      const issue = res.body[0];
      expect(issue).toHaveProperty('id');
      expect(issue).toHaveProperty('type');
      expect(issue).toHaveProperty('severity');
      expect(issue).toHaveProperty('entityId');
      expect(issue).toHaveProperty('message');
    });
  });

  describe('Digest Preview & Week-over-Week Changes', () => {
    it('GET /api/digests/preview returns 200 OK for valid period range', async () => {
      const res = await request(app).get('/api/digests/preview?from=2026-07-06&to=2026-07-20');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('draft');
      expect(Array.isArray(res.body.sections)).toBe(true);
    });

    it('GET /api/digests/preview returns 400 Bad Request when from > to', async () => {
      const res = await request(app).get('/api/digests/preview?from=2026-08-01&to=2026-07-01');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Bad Request');
      expect(res.body.message).toContain('cannot be after');
    });

    it('GET /api/digests/preview returns 400 Bad Request when parameters are missing', async () => {
      const res = await request(app).get('/api/digests/preview');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Bad Request');
    });

    it('GET /api/digests/changes returns 200 OK with comparison object', async () => {
      const res = await request(app).get('/api/digests/changes?from=2026-07-20&to=2026-07-27');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('currentPeriod');
      expect(res.body).toHaveProperty('previousPeriod');
      expect(Array.isArray(res.body.changes)).toBe(true);
    });
  });

  describe('Draft Creation, Update, Approval & Publication Endpoints', () => {
    let createdDraftId: string;

    it('POST /api/digests/draft creates a new draft payload and persists it', async () => {
      const genRes = await request(app)
        .post('/api/digests/draft')
        .send({ from: '2026-07-06', to: '2026-07-20' });

      expect(genRes.status).toBe(200);
      expect(genRes.body).toHaveProperty('id');
      expect(genRes.body.isApproved).toBe(false);
      expect(genRes.body.content.status).toBe('draft');

      const draftPayload = {
        ...genRes.body,
        id: `draft-api-test-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };

      const createRes = await request(app)
        .post('/api/digests/drafts')
        .send(draftPayload);

      expect(createRes.status).toBe(201);
      expect(createRes.body.id).toBe(draftPayload.id);

      createdDraftId = createRes.body.id;
    });

    it('PUT /api/digests/draft/:id updates draft content', async () => {
      expect(createdDraftId).toBeDefined();

      const getRes = await request(app).get(`/api/digests/draft/${createdDraftId}`);
      expect(getRes.status).toBe(200);
      const draftObj = getRes.body;

      draftObj.content.sections[0].summary = 'Updated summary by human reviewer';

      const updateRes = await request(app)
        .put(`/api/digests/draft/${createdDraftId}`)
        .send(draftObj);

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.content.sections[0].summary).toBe('Updated summary by human reviewer');
    });

    it('POST /api/digests/draft/:id/publish fails when draft is unapproved', async () => {
      const res = await request(app).post(`/api/digests/draft/${createdDraftId}/publish`);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('requires human approval');
    });

    it('POST /api/digests/draft/:id/approve marks draft as approved', async () => {
      const res = await request(app).post(`/api/digests/draft/${createdDraftId}/approve`);
      expect(res.status).toBe(200);
      expect(res.body.isApproved).toBe(true);
    });

    it('POST /api/digests/draft/:id/publish publishes an approved draft', async () => {
      const res = await request(app).post(`/api/digests/draft/${createdDraftId}/publish`);
      expect(res.status).toBe(200);
      expect(res.body.content.status).toBe('published');
    });

    it('GET /api/digests/published/:id retrieves the published digest payload', async () => {
      const res = await request(app).get(`/api/digests/published/${createdDraftId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(createdDraftId);
      expect(res.body.content.status).toBe('published');
    });

    it('POST /api/digests/draft/:id/publish is IDEMPOTENT and succeeds on re-publish', async () => {
      const res = await request(app).post(`/api/digests/draft/${createdDraftId}/publish`);
      expect(res.status).toBe(200);
      expect(res.body.content.status).toBe('published');
    });
  });

  describe('Error Handling', () => {
    it('GET /api/digests/published/:id returns 404 for nonexistent draft', async () => {
      const res = await request(app).get('/api/digests/published/non-existent-draft-id-123987');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });

    it('Returns formatted error response without leaking code tracebacks or stack frames', async () => {
      const res = await request(app).get('/api/digests/published/invalid-id-for-test');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('message');
      expect(res.text).not.toContain('at ');
      expect(res.text).not.toContain('node_modules');
    });
  });
});
