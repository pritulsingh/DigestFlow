import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import {
  WeeklyDigest,
  WeeklyChangeComparison,
  DataQualityIssue,
  Draft,
} from '../types';

export function useWeeklyDigest(initialFrom: string = '2026-07-06', initialTo: string = '2026-07-12') {
  const [from, setFrom] = useState<string>(initialFrom);
  const [to, setTo] = useState<string>(initialTo);

  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [changes, setChanges] = useState<WeeklyChangeComparison | null>(null);
  const [qualityIssues, setQualityIssues] = useState<DataQualityIssue[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [lastSavedDraft, setLastSavedDraft] = useState<Draft | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [generatingDraft, setGeneratingDraft] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load preview digest, changes, and data quality for the selected period
  const fetchPeriodData = useCallback(async (periodFrom: string, periodTo: string) => {
    try {
      setLoading(true);
      setError(null);
      const [digestData, changesData, issuesData] = await Promise.all([
        apiClient.getDigestPreview(periodFrom, periodTo),
        apiClient.getDigestChanges(periodFrom, periodTo),
        apiClient.getDataQuality(),
      ]);

      setDigest(digestData);
      setChanges(changesData);
      setQualityIssues(issuesData);

      // Check if a draft already exists for this digest in persisted drafts (reloading behavior)
      try {
        const draftsList = await apiClient.getDrafts();
        const existing = draftsList.find(
          (d) =>
            d.digestId === digestData.id ||
            d.id === `draft-${digestData.id}` ||
            (d.content.periodStart === periodFrom && d.content.periodEnd === periodTo)
        );
        if (existing) {
          setDraft(existing);
          setLastSavedDraft(JSON.parse(JSON.stringify(existing)));
          setIsDirty(false);
        } else {
          setDraft(null);
          setLastSavedDraft(null);
          setIsDirty(false);
        }
      } catch {}
    } catch (err: any) {
      setError(err.message || 'Failed to load digest data for the selected period.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriodData(from, to);
  }, [from, to, fetchPeriodData]);

  const changePeriod = (newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
    setDraft(null);
    setLastSavedDraft(null);
    setIsDirty(false);
    setError(null);
    setStatusMessage(null);
  };

  // Generate a new draft using LocalDraftProvider via Express REST API
  const handleGenerateDraft = async (tone?: string) => {
    try {
      setGeneratingDraft(true);
      setError(null);
      const generatedDraft = await apiClient.generateDraft(from, to, tone);
      setDraft(generatedDraft);
      setIsDirty(true); // Generated draft is unsaved until user clicks Save
      setStatusMessage('Draft generated successfully from structured facts. Human review required before publishing.');
    } catch (err: any) {
      setError(err.message || 'Failed to generate draft.');
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Inline edit callback to update draft sections or content locally
  const updateDraftLocally = (updatedDraft: Draft) => {
    setDraft(updatedDraft);
    setIsDirty(true);
  };

  // Revert unpersisted changes back to last saved draft (or reset if unsaved generated)
  const revertChanges = () => {
    if (lastSavedDraft) {
      setDraft(JSON.parse(JSON.stringify(lastSavedDraft)));
      setIsDirty(false);
      setStatusMessage('Reverted unpersisted edits back to last saved draft.');
    } else {
      setDraft(null);
      setIsDirty(false);
      setStatusMessage('Discarded unpersisted draft edits.');
    }
    setError(null);
  };

  // Save draft to application-owned persistence (data/drafts.json)
  const saveDraft = async () => {
    if (!draft) return;
    try {
      setSaving(true);
      setError(null);

      // Check if draft already exists in persistence
      const existingDrafts = await apiClient.getDrafts();
      const exists = existingDrafts.some((d) => d.id === draft.id);

      let saved: Draft;
      if (exists) {
        saved = await apiClient.updateDraft(draft);
      } else {
        saved = await apiClient.createDraft(draft);
      }

      setDraft(saved);
      setLastSavedDraft(JSON.parse(JSON.stringify(saved)));
      setIsDirty(false);
      setStatusMessage(`Draft '${saved.id}' saved successfully to persistence.`);
    } catch (err: any) {
      // Preserve edited draft in state on failed save (do NOT discard edits)
      setError(`Failed to save draft: ${err.message || 'Server error'}. Your edits have been preserved.`);
    } finally {
      setSaving(false);
    }
  };

  // Approve draft (human reviewer approval)
  const approveDraft = async () => {
    if (!draft) return;
    try {
      setSaving(true);
      setError(null);

      // First ensure draft is saved if dirty
      let activeDraft = draft;
      if (isDirty || !lastSavedDraft) {
        const existingDrafts = await apiClient.getDrafts();
        const exists = existingDrafts.some((d) => d.id === draft.id);
        if (exists) {
          activeDraft = await apiClient.updateDraft(draft);
        } else {
          activeDraft = await apiClient.createDraft(draft);
        }
      }

      const approved = await apiClient.approveDraft(activeDraft.id);
      setDraft(approved);
      setLastSavedDraft(JSON.parse(JSON.stringify(approved)));
      setIsDirty(false);
      setStatusMessage(`Draft '${approved.id}' approved by human reviewer.`);
    } catch (err: any) {
      setError(`Failed to approve draft: ${err.message || 'Server error'}. Edits preserved.`);
    } finally {
      setSaving(false);
    }
  };

  // Publish draft (gated by human approval)
  const publishDraft = async () => {
    if (!draft) return;
    try {
      setSaving(true);
      setError(null);

      const published = await apiClient.publishDraft(draft.id);
      setDraft(published);
      setLastSavedDraft(JSON.parse(JSON.stringify(published)));
      setIsDirty(false);
      setStatusMessage(`Digest '${published.id}' published successfully with audit log event.`);
    } catch (err: any) {
      setError(`Failed to publish draft: ${err.message || 'Server error'}. Edits preserved.`);
    } finally {
      setSaving(false);
    }
  };

  return {
    from,
    to,
    changePeriod,
    digest,
    changes,
    qualityIssues,
    draft,
    lastSavedDraft,
    loading,
    generatingDraft,
    saving,
    isDirty,
    error,
    statusMessage,
    handleGenerateDraft,
    updateDraftLocally,
    revertChanges,
    saveDraft,
    approveDraft,
    publishDraft,
    refetch: () => fetchPeriodData(from, to),
  };
}
