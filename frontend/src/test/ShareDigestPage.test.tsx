import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShareDigestPage } from '../pages/ShareDigestPage';
import { apiClient, ApiError } from '../api/client';
import {
  mockDraft,
  mockWeeklyChanges,
  mockDataQualityIssues,
} from './mocks';

describe('Shareable Digest Page (/share/:digestId) Test Suite', () => {
  const publishedDraft: typeof mockDraft = {
    ...mockDraft,
    id: 'draft-pub-999',
    isApproved: true,
    content: {
      ...mockDraft.content,
      status: 'published',
      updatedAt: '2026-07-20T12:00:00Z',
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Share Page Loading State: Displays loading spinner payload', async () => {
    vi.spyOn(apiClient, 'getPublishedDigest').mockReturnValue(new Promise(() => {}));

    render(<ShareDigestPage shareId="draft-pub-999" />);

    expect(screen.getByText('Retrieving published digest payload via Express REST API...')).toBeInTheDocument();
  });

  it('2. Published Executive Digest Rendering: Renders published summary, project sections, and zero edit controls', async () => {
    vi.spyOn(apiClient, 'getPublishedDigest').mockResolvedValue(publishedDraft);
    vi.spyOn(apiClient, 'getDigestChanges').mockResolvedValue(mockWeeklyChanges);
    vi.spyOn(apiClient, 'getDataQuality').mockResolvedValue(mockDataQualityIssues);

    render(<ShareDigestPage shareId="draft-pub-999" />);

    await waitFor(() => {
      expect(screen.getByText('Published Weekly Executive Digest')).toBeInTheDocument();
      expect(screen.getByText('OFFICIALLY PUBLISHED')).toBeInTheDocument();
      expect(screen.getByText('Northwind Health')).toBeInTheDocument();
      expect(screen.getByText('Patient Portal Latency Nominal')).toBeInTheDocument();
    });

    // Zero edit controls should exist on read-only share page
    expect(screen.queryByRole('button', { name: /Save Draft/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Publish Digest/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Generate Draft/i })).not.toBeInTheDocument();
  });

  it('3. Nonexistent Digest Error (404): Renders 404 nonexistent digest message', async () => {
    vi.spyOn(apiClient, 'getPublishedDigest').mockRejectedValue(
      new ApiError(404, 'Not Found', 'Digest record draft-invalid-404 not found.')
    );

    render(<ShareDigestPage shareId="draft-invalid-404" />);

    await waitFor(() => {
      expect(screen.getByText('Digest Not Found (404)')).toBeInTheDocument();
      expect(screen.getByText('Nonexistent Digest Record')).toBeInTheDocument();
      expect(screen.getByText('Digest record draft-invalid-404 not found.')).toBeInTheDocument();
    });
  });

  it('4. Unpublished Digest Warning (400): Renders 400 unpublished digest alert', async () => {
    vi.spyOn(apiClient, 'getPublishedDigest').mockRejectedValue(
      new ApiError(400, 'Bad Request', 'Digest draft-unpub-100 has not been published yet.')
    );

    render(<ShareDigestPage shareId="draft-unpub-100" />);

    await waitFor(() => {
      expect(screen.getByText('Digest Not Published')).toBeInTheDocument();
      expect(screen.getByText('Unpublished Digest')).toBeInTheDocument();
      expect(screen.getByText('Digest draft-unpub-100 has not been published yet.')).toBeInTheDocument();
    });
  });

  it('5. API Network Error: Displays sanitized error message with retry button', async () => {
    vi.spyOn(apiClient, 'getPublishedDigest').mockRejectedValue(
      new ApiError(500, 'Internal Server Error', 'Failed to connect to backend server')
    );

    render(<ShareDigestPage shareId="draft-err-500" />);

    await waitFor(() => {
      expect(screen.getByText('API Retrieval Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to connect to backend server')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });
  });
});
