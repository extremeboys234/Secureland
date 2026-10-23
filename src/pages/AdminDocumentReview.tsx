import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Download, ExternalLink, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useAuth } from '../services/authService';

interface PendingDocument {
  id: string;
  user_id: number | null;
  filename: string;
  document_number: string | null;
  property_id: string | null;
  owner_name: string | null;
  issuing_authority: string | null;
  issue_date: string | null;
  description: string | null;
  upload_date: string | null;
  approval_status: 'pending';
  integrity_status: string | null;
  sha256_hash: string;
  submitting_user: string | null;
}

interface TrustedReference {
  id: string;
  name: string;
  sha256_hash: string;
  is_demo: boolean | number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

interface VerificationResult {
  result: string;
  reason: string;
  calculated_sha256: string | null;
  expected_sha256: string | null;
}

const AdminDocumentReview: React.FC = () => {
  const { user, loading: authLoading, csrfCheckedRequest, csrfProtectedRequest } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [references, setReferences] = useState<TrustedReference[]>([]);
  const [selectedReferences, setSelectedReferences] = useState<Record<string, string>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [rejectingDocument, setRejectingDocument] = useState<PendingDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<Record<string, VerificationResult>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [workingDocumentId, setWorkingDocumentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    const [queueResponse, referencesResponse] = await Promise.all([
      csrfCheckedRequest('/documents/pending-review.php', 'GET'),
      csrfCheckedRequest('/references/list.php?active=1', 'GET'),
    ]);
    const queue = await queueResponse.json() as ApiResponse<PendingDocument[]>;
    const refs = await referencesResponse.json() as ApiResponse<TrustedReference[]>;
    if (!queueResponse.ok || !queue.success || !queue.data) {
      throw new Error(queue.error || 'Unable to load pending documents.');
    }
    if (!referencesResponse.ok || !refs.success || !refs.data) {
      throw new Error(refs.error || 'Unable to load active trusted references.');
    }
    return { documents: queue.data, references: refs.data };
  }, [csrfCheckedRequest]);

  const updateQueue = useCallback((queue: PendingDocument[], refs: TrustedReference[]) => {
    setDocuments(queue);
    setReferences(refs);
    setSelectedReferences((current) => {
      const next = { ...current };
      for (const document of queue) {
        if (!next[document.id] || !refs.some((reference) => reference.id === next[document.id])) {
          const matchingReference = refs.find(
            (reference) => reference.sha256_hash.toLowerCase() === document.sha256_hash.toLowerCase()
          );
          next[document.id] = matchingReference?.id ?? refs[0]?.id ?? '';
        }
      }
      return next;
    });
  }, []);

  const refreshQueue = useCallback(async () => {
    try {
      const queue = await loadQueue();
      updateQueue(queue.documents, queue.references);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load pending documents.');
    } finally {
      setIsLoading(false);
    }
  }, [loadQueue, updateQueue]);

  useEffect(() => {
    if (authLoading || !user || user.role !== 'admin') return;
    let active = true;
    const fetchQueue = async () => {
      try {
        const queue = await loadQueue();
        if (!active) return;
        updateQueue(queue.documents, queue.references);
        setError(null);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load pending documents.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void fetchQueue();
    return () => {
      active = false;
    };
  }, [authLoading, user, loadQueue, updateQueue]);

  const verifyDocument = async (document: PendingDocument) => {
    const referenceId = selectedReferences[document.id];
    if (!referenceId) {
      setError('No active trusted references are available. Manage references before running a hash comparison.');
      return;
    }
    setWorkingDocumentId(document.id);
    setError(null);
    setNotice(null);
    try {
      const body = new URLSearchParams({ document_id: document.id, reference_id: referenceId });
      const response = await csrfProtectedRequest('/documents/verify.php', 'POST', body, {
        'Content-Type': 'application/x-www-form-urlencoded',
      });
      const result = await response.json() as ApiResponse<VerificationResult>;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Hash verification failed.');
      }
      setVerificationResults((current) => ({ ...current, [document.id]: result.data! }));
      await refreshQueue();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : 'Hash verification failed.');
    } finally {
      setWorkingDocumentId(null);
    }
  };

  const decide = async (document: PendingDocument, decision: 'approve' | 'reject', note: string) => {
    const reviewNote = note.trim();
    if (decision === 'reject' && !reviewNote) {
      setRejectionError('A rejection reason is required.');
      return false;
    }
    if (workingDocumentId !== null) {
      return false;
    }
    setWorkingDocumentId(document.id);
    setError(null);
    setNotice(null);
    if (decision === 'reject') setRejectionError(null);
    try {
      const body = new URLSearchParams({
        document_id: document.id,
        decision,
        review_note: reviewNote,
      });
      const response = await csrfProtectedRequest('/documents/review.php', 'POST', body, {
        'Content-Type': 'application/x-www-form-urlencoded',
      });
      const result = await response.json() as ApiResponse<{ approval_status: string }>;
      const expectedStatus = decision === 'approve' ? 'approved' : 'rejected';
      if (!response.ok || !result.success || result.data?.approval_status !== expectedStatus) {
        throw new Error(result.error || `Unable to ${decision} this document.`);
      }
      setNotice(`${document.filename} was ${result.data.approval_status}.`);
      setDocuments((current) => current.filter((item) => item.id !== document.id));
      return true;
    } catch (decisionError) {
      const message = decisionError instanceof Error ? decisionError.message : 'Unable to record review decision.';
      setError(message);
      if (decision === 'reject') setRejectionError(message);
      return false;
    } finally {
      setWorkingDocumentId(null);
    }
  };

  const downloadDocument = async (document: PendingDocument) => {
    setWorkingDocumentId(document.id);
    setError(null);
    try {
      const response = await csrfProtectedRequest(`/documents/download.php?id=${encodeURIComponent(document.id)}`, 'GET');
      if (!response.ok) {
        const result = await response.json() as ApiResponse<null>;
        throw new Error(result.error || 'Unable to download document.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = document.filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Unable to download document.');
    } finally {
      setWorkingDocumentId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div role="alert" className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          Administrator access is required to review documents.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar activeItem="pending-review" />
      <div className="app-main">
        <TopNav title="Pending Document Verification" />
        <main className="app-content">
          <div className="app-content-inner space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Pending Document Verification</h1>
                <p className="mt-2 text-gray-600">Review the submitted details and integrity evidence before deciding approval.</p>
              </div>
              <Button variant="outline" onClick={() => void refreshQueue()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh queue
              </Button>
            </div>

            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
            {notice && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</div>}
            {references.length === 0 && (
              <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                No active trusted references are available. Hash verification will remain unavailable until an administrator activates a validated reference.
                {' '}<Link className="font-medium underline" to="/references">Manage trusted references</Link>
              </div>
            )}

            {documents.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
                No documents are pending review.
              </div>
            ) : documents.map((document) => {
              const result = verificationResults[document.id];
              const working = workingDocumentId === document.id;
              return (
                <section key={document.id} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{document.filename}</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        Document number: {document.document_number || 'Not provided'}
                        {' · '}Uploaded: {document.upload_date ? new Date(document.upload_date).toLocaleString() : 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">Submitted by: {document.submitting_user || `User ${document.user_id ?? 'unknown'}`}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">Pending</span>
                  </div>

                  <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div><dt className="text-xs font-medium uppercase text-gray-500">Property / survey ID</dt><dd className="mt-1 text-sm text-gray-900">{document.property_id || 'Not provided'}</dd></div>
                    <div><dt className="text-xs font-medium uppercase text-gray-500">Owner name</dt><dd className="mt-1 text-sm text-gray-900">{document.owner_name || 'Not provided'}</dd></div>
                    <div><dt className="text-xs font-medium uppercase text-gray-500">Issuing authority</dt><dd className="mt-1 text-sm text-gray-900">{document.issuing_authority || 'Not provided'}</dd></div>
                    <div><dt className="text-xs font-medium uppercase text-gray-500">Issue date</dt><dd className="mt-1 text-sm text-gray-900">{document.issue_date || 'Not provided'}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-xs font-medium uppercase text-gray-500">SHA-256 upload hash</dt><dd className="mt-1 break-all font-mono text-xs text-gray-700">{document.sha256_hash}</dd></div>
                    <div><dt className="text-xs font-medium uppercase text-gray-500">Integrity status</dt><dd className="mt-1 text-sm font-medium">{document.integrity_status ?? 'Not checked'}</dd></div>
                    {document.description && <div className="sm:col-span-2 lg:col-span-3"><dt className="text-xs font-medium uppercase text-gray-500">Description</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{document.description}</dd></div>}
                  </dl>

                  <div className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
                    <Button variant="outline" onClick={() => navigate(`/document/${document.id}`)}>
                      <ExternalLink className="mr-2 h-4 w-4" /> Open details
                    </Button>
                    <Button variant="outline" onClick={() => void downloadDocument(document)} disabled={working}>
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                    <label className="flex min-w-64 flex-col gap-1 text-sm text-gray-700">
                      Active trusted reference
                      <select
                        value={selectedReferences[document.id] ?? ''}
                        onChange={(event) => {
                          setSelectedReferences((current) => ({ ...current, [document.id]: event.target.value }));
                          setVerificationResults((current) => {
                            const next = { ...current };
                            delete next[document.id];
                            return next;
                          });
                        }}
                        disabled={working || references.length === 0}
                        className="rounded-md border border-gray-300 px-3 py-2"
                      >
                        {references.map((reference) => (
                          <option key={reference.id} value={reference.id}>
                            {reference.is_demo === true || reference.is_demo === 1 ? 'Fictional demo — ' : ''}
                            {reference.id} — {reference.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button variant="secondary" onClick={() => void verifyDocument(document)} disabled={working || references.length === 0}>
                      {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                      Check hash
                    </Button>
                  </div>

                  {result && (
                    <div className={`rounded-lg border p-4 ${
                      result.result === 'MATCH' ? 'border-green-200 bg-green-50' :
                        result.result === 'MISMATCH' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
                    }`}>
                      <p className="flex items-center gap-2 font-semibold">
                        {result.result === 'MATCH' ? <CheckCircle className="h-5 w-5" /> :
                          result.result === 'MISMATCH' ? <XCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        {result.result === 'MATCH' ? 'Hash check successful' : 'Hash check'}: {result.result}
                      </p>
                      <p className="mt-1 text-sm">{result.reason}</p>
                      <p className="mt-2 text-xs">A hash match means byte equality with this reference only; it does not prove ownership or legal authenticity.</p>
                    </div>
                  )}

                  <div className="space-y-3 border-t border-gray-100 pt-4">
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                      Optional approval note
                      <textarea
                        value={reviewNotes[document.id] ?? ''}
                        onChange={(event) => setReviewNotes((current) => ({ ...current, [document.id]: event.target.value }))}
                        maxLength={5000}
                        rows={2}
                        disabled={working}
                        className="rounded-md border border-gray-300 px-3 py-2 font-normal"
                        placeholder="Add a note for the document owner (optional)."
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="primary" onClick={() => void decide(document, 'approve', reviewNotes[document.id] ?? '')} disabled={working}>
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRejectingDocument(document);
                          setRejectionReason('');
                          setRejectionError(null);
                          setError(null);
                          setNotice(null);
                        }}
                        disabled={working}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </main>
      </div>
      {rejectingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-document-title"
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
          >
            <h2 id="reject-document-title" className="text-lg font-semibold text-gray-900">
              Reject {rejectingDocument.filename}?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Provide a reason. It will be recorded with the decision and shown to the document owner.
            </p>
            <label htmlFor="rejection-reason" className="mt-4 block text-sm font-medium text-gray-700">
              Rejection reason
            </label>
            <textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(event) => {
                setRejectionReason(event.target.value);
                setRejectionError(null);
              }}
              maxLength={5000}
              rows={4}
              disabled={workingDocumentId === rejectingDocument.id}
              aria-invalid={rejectionError !== null}
              aria-describedby={rejectionError ? 'rejection-reason-error' : undefined}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              autoFocus
            />
            {rejectionError && (
              <p id="rejection-reason-error" role="alert" className="mt-2 text-sm text-red-700">
                {rejectionError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectingDocument(null);
                  setRejectionReason('');
                  setRejectionError(null);
                }}
                disabled={workingDocumentId === rejectingDocument.id}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  if (!rejectionReason.trim()) {
                    setRejectionError('A rejection reason is required.');
                    return;
                  }
                  const saved = await decide(rejectingDocument, 'reject', rejectionReason);
                  if (saved) {
                    setRejectingDocument(null);
                    setRejectionReason('');
                    setRejectionError(null);
                  }
                }}
                disabled={workingDocumentId === rejectingDocument.id}
              >
                {workingDocumentId === rejectingDocument.id ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rejecting...</>
                ) : 'Confirm rejection'}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminDocumentReview;
