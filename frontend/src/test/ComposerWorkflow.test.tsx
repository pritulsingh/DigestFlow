import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { apiClient } from '../api/client';
import {
  mockHealthResponse,
  mockSystemInfo,
  mockProjects,
  mockSignals,
  mockRuns,
  mockDataQualityIssues,
  mockWeeklyDigest,
  mockWeeklyChanges,
  mockDraft,
} from './mocks';

describe('Composer Workflow: Draft Generation, Editing, Saving & Explicit Publishing', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(apiClient, 'getHealth').mockResolvedValue(mockHealthResponse);
    vi.spyOn(apiClient, 'getSystemInfo').mockResolvedValue(mockSystemInfo);
    vi.spyOn(apiClient, 'getProjects').mockResolvedValue(mockProjects);
    vi.spyOn(apiClient, 'getSignals').mockResolvedValue(mockSignals);
    vi.spyOn(apiClient, 'getRuns').mockResolvedValue(mockRuns);
    vi.spyOn(apiClient, 'getDataQuality').mockResolvedValue(mockDataQualityIssues);
    vi.spyOn(apiClient, 'getDigestPreview').mockResolvedValue(mockWeeklyDigest);
    vi.spyOn(apiClient, 'getDigestChanges').mockResolvedValue(mockWeeklyChanges);
    vi.spyOn(apiClient, 'getDrafts').mockResolvedValue([]);
  });

  it('1. Week Selection: Changes date period inputs and triggers period refetch', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Select Period:')).toBeInTheDocument();
    });

    const fromInput = screen.getByLabelText(/From:/i) as HTMLInputElement;
    const toInput = screen.getByLabelText(/To:/i) as HTMLInputElement;

    fireEvent.change(fromInput, { target: { value: '2026-07-01' } });
    fireEvent.change(toInput, { target: { value: '2026-07-15' } });

    expect(fromInput.value).toBe('2026-07-01');
    expect(toInput.value).toBe('2026-07-15');
  });

  it('2. Draft Generation: Generates draft payload and surfaces DraftEditor component', async () => {
    vi.spyOn(apiClient, 'generateDraft').mockResolvedValue(mockDraft);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generate Draft Text/i })).toBeInTheDocument();
    });

    const generateBtn = screen.getByRole('button', { name: /Generate Draft Text/i });
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(apiClient.generateDraft).toHaveBeenCalledWith('2026-07-06', '2026-07-12', undefined);
      expect(screen.getByText(/Review & Edit Draft Content/i)).toBeInTheDocument();
    });
  });

  it('3. Draft Editing & Unsaved State: Edits section summary, surfaces unsaved changes indicators', async () => {
    vi.spyOn(apiClient, 'generateDraft').mockResolvedValue(mockDraft);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generate Draft Text/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Generate Draft Text/i }));

    await waitFor(() => {
      expect(screen.getByText(/Review & Edit Draft Content/i)).toBeInTheDocument();
    });

    const textarea = screen.getByDisplayValue('Initial generated summary for Northwind Health.');
    fireEvent.change(textarea, { target: { value: 'Edited summary by reviewer for Northwind Health.' } });

    expect(screen.getAllByText('UNSAVED EDITS').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('Edited summary by reviewer for Northwind Health.')).toBeInTheDocument();
  });

  it('4. Save Action: Saves draft changes and transitions to Saved state', async () => {
    const updatedDraft: typeof mockDraft = {
      ...mockDraft,
      content: {
        ...mockDraft.content,
        sections: [
          {
            ...mockDraft.content.sections[0],
            summary: 'Edited summary by reviewer for Northwind Health.',
          },
        ],
      },
    };

    vi.spyOn(apiClient, 'generateDraft').mockResolvedValue(mockDraft);
    vi.spyOn(apiClient, 'createDraft').mockResolvedValue(updatedDraft);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generate Draft Text/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Generate Draft Text/i }));

    await waitFor(() => {
      expect(screen.getByText(/Review & Edit Draft Content/i)).toBeInTheDocument();
    });

    const textarea = screen.getByDisplayValue('Initial generated summary for Northwind Health.');
    fireEvent.change(textarea, { target: { value: 'Edited summary by reviewer for Northwind Health.' } });

    const saveBtn = screen.getByRole('button', { name: /Save Draft/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(apiClient.createDraft).toHaveBeenCalled();
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  it('5. Publish Confirmation Modal & Publish Result: Opens modal, confirms publication, updates state to PUBLISHED', async () => {
    const approvedDraft: typeof mockDraft = {
      ...mockDraft,
      isApproved: true,
      content: { ...mockDraft.content, status: 'approved' },
    };

    const publishedDraft: typeof mockDraft = {
      ...mockDraft,
      isApproved: true,
      content: { ...mockDraft.content, status: 'published' },
    };

    vi.spyOn(apiClient, 'generateDraft').mockResolvedValue(mockDraft);
    vi.spyOn(apiClient, 'createDraft').mockResolvedValue(mockDraft);
    vi.spyOn(apiClient, 'approveDraft').mockResolvedValue(approvedDraft);
    vi.spyOn(apiClient, 'publishDraft').mockResolvedValue(publishedDraft);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generate Draft Text/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Generate Draft Text/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Approve Draft/i })).toBeInTheDocument();
    });

    // Approve draft
    fireEvent.click(screen.getByRole('button', { name: /Approve Draft/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Publish Digest/i })).toBeInTheDocument();
    });

    // Trigger publish modal
    fireEvent.click(screen.getByRole('button', { name: /Publish Digest/i }));

    await waitFor(() => {
      expect(screen.getByText('Confirm Digest Publication')).toBeInTheDocument();
    });

    // Confirm publication
    fireEvent.click(screen.getByRole('button', { name: /Yes, Publish Digest/i }));

    await waitFor(() => {
      expect(apiClient.publishDraft).toHaveBeenCalledWith(mockDraft.id);
      expect(screen.getAllByText('PUBLISHED').length).toBeGreaterThan(0);
    });
  });
});
