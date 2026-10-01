import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { apiClient, ApiError } from '../api/client';
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

describe('App Load, Navigation & Inspection Views Test Suite', () => {
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
    vi.spyOn(apiClient, 'getDrafts').mockResolvedValue([mockDraft]);
  });

  it('1. Application Load: Renders header, navigation bar, and default Composer page', async () => {
    render(<App />);

    // Application shell title
    expect(screen.getAllByText('Weekly Digest Composer').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Supanova Labs/i).length).toBeGreaterThan(0);

    // Navigation items
    expect(screen.getByRole('button', { name: /System Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Source Data Fixtures/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Data Quality Inspection/i })).toBeInTheDocument();

    // Composer Page Week Selector should be visible by default
    await waitFor(() => {
      expect(screen.getByText('Select Period:')).toBeInTheDocument();
    });
  });

  it('2. Navigation & View Switching: Switches between Composer, System Overview, Source Data & Quality views', async () => {
    render(<App />);

    // Switch to Source Data Inspection page
    const sourceTab = screen.getByRole('button', { name: /Source Data Fixtures/i });
    fireEvent.click(sourceTab);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Source Data Inspection' })).toBeInTheDocument();
      expect(screen.getByText(/Signals \(2 records loaded/i)).toBeInTheDocument();
    });

    // Switch to Data Quality page
    const qualityTab = screen.getByRole('button', { name: /Data Quality Inspection/i });
    fireEvent.click(qualityTab);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Data Quality Inspection' })).toBeInTheDocument();
      expect(screen.getByText(/Detected Issues/i)).toBeInTheDocument();
    });

    // Switch to System Overview (API Health) page
    const overviewTab = screen.getByRole('button', { name: /System Overview/i });
    fireEvent.click(overviewTab);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'System Overview & API Health' })).toBeInTheDocument();
      expect(screen.getByText('Express Backend API')).toBeInTheDocument();
    });
  });

  it('3. API Loading State: Displays loading indicator while fetching records', async () => {
    // Delay API response to assert loading spinner
    vi.spyOn(apiClient, 'getDigestPreview').mockReturnValue(new Promise(() => {}));

    render(<App />);

    expect(screen.getByText('Aggregating source data through Express WeeklyDigestService...')).toBeInTheDocument();
  });

  it('4. API Error State: Displays sanitized error message on API failure with retry option', async () => {
    vi.spyOn(apiClient, 'getDigestPreview').mockRejectedValue(
      new ApiError(500, 'Internal Server Error', 'Failed to connect to backend server')
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Digest Action Warning')).toBeInTheDocument();
      expect(screen.getByText('Failed to connect to backend server')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });
  });

  it('5. Empty State: Displays EmptyState component when project activity or data quality returns 0 records', async () => {
    const emptyDigest: typeof mockWeeklyDigest = {
      ...mockWeeklyDigest,
      sections: [],
    };
    vi.spyOn(apiClient, 'getDigestPreview').mockResolvedValue(emptyDigest);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('No Project Activity for Selected Period')).toBeInTheDocument();
    });
  });

  it('6. Project Activity & Source Traceability Rendering: Displays project sections, items, badges, and source refs', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Northwind Health').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Patient Portal Latency Nominal').length).toBeGreaterThan(0);
      expect(screen.getAllByText('signal-ledger.json#id:sig-001').length).toBeGreaterThan(0);
    });
  });

  it('7. Week-over-Week Changes & Attention Rendering: Displays changes comparison and quality attention section', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText(/Week-over-Week Changes/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/New telemetry signal recorded/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Items Requiring Attention/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Signal sig-002 requires project routing assignment/i).length).toBeGreaterThan(0);
    });
  });
});
