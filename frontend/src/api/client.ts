import {
  HealthResponse,
  SystemInfo,
  Signal,
  Project,
  Run,
  DataQualityIssue,
  WeeklyDigest,
  WeeklyChangeComparison,
  Draft,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  status: number;
  statusText: string;

  constructor(status: number, statusText: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
    } catch (err: any) {
      throw new ApiError(0, 'Network Error', err.message || 'Failed to connect to backend server');
    }

    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const body = await response.json();
        if (body.message) {
          errorMessage = body.message;
        }
      } catch {}
      throw new ApiError(response.status, response.statusText, errorMessage);
    }

    return response.json();
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  async getSystemInfo(): Promise<SystemInfo> {
    return this.request<SystemInfo>('/system-info');
  }

  async getSignals(project?: string): Promise<Signal[]> {
    const query = project ? `?project=${encodeURIComponent(project)}` : '';
    return this.request<Signal[]>(`/signals${query}`);
  }

  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getRuns(runId?: number): Promise<Run[]> {
    const query = runId !== undefined ? `?run=${runId}` : '';
    return this.request<Run[]>(`/runs${query}`);
  }

  async getDataQuality(): Promise<DataQualityIssue[]> {
    return this.request<DataQualityIssue[]>('/data-quality');
  }

  async getDigestPreview(from: string, to: string): Promise<WeeklyDigest> {
    return this.request<WeeklyDigest>(`/digests/preview?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  }

  async getDigestChanges(from: string, to: string): Promise<WeeklyChangeComparison> {
    return this.request<WeeklyChangeComparison>(`/digests/changes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  }

  async generateDraft(from: string, to: string, tone?: string): Promise<Draft> {
    return this.request<Draft>('/digests/draft', {
      method: 'POST',
      body: JSON.stringify({ from, to, tone }),
    });
  }

  async getDrafts(): Promise<Draft[]> {
    return this.request<Draft[]>('/digests/drafts');
  }

  async getDraftById(id: string): Promise<Draft> {
    return this.request<Draft>(`/digests/drafts/${encodeURIComponent(id)}`);
  }

  async createDraft(draft: Draft): Promise<Draft> {
    return this.request<Draft>('/digests/drafts', {
      method: 'POST',
      body: JSON.stringify(draft),
    });
  }

  async updateDraft(draft: Draft): Promise<Draft> {
    return this.request<Draft>(`/digests/drafts/${encodeURIComponent(draft.id)}`, {
      method: 'PUT',
      body: JSON.stringify(draft),
    });
  }

  async approveDraft(id: string): Promise<Draft> {
    return this.request<Draft>(`/digests/drafts/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    });
  }

  async publishDraft(id: string): Promise<Draft> {
    return this.request<Draft>(`/digests/drafts/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
    });
  }

  async getPublishedDigest(id: string): Promise<Draft> {
    return this.request<Draft>(`/digests/published/${encodeURIComponent(id)}`);
  }
}

export const apiClient = new ApiClient();

