import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Loader2, Search, ShieldCheck } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../services/authService';

interface DocumentSummary {
  id: string;
  filename: string;
  actual_filename: string;
  sha256_hash: string;
  upload_date: string;
  processing_status: string;
  approval_status: string;
  integrity_status: string | null;
}

interface VerificationLog {
  id: number;
  document_id: string;
  reference_id: string;
  verification_status: string;
  verified_at: string;
  verified_by: number | null;
  file_name: string | null;
  file_size: number | null;
  calculated_sha256: string | null;
  expected_sha256: string | null;
  signature_status: string | null;
  reason_code: string | null;
}

const VerificationHistory: React.FC = () => {
  const { user, loading, csrfCheckedRequest } = useAuth();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [history, setHistory] = useState<VerificationLog[]>([]);
  const [search, setSearch] = useState('');
  const [loadingState, setLoadingState] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const loadDocuments = async () => {
      setLoadingState(true);
      setError(null);

      try {
        const response = await csrfCheckedRequest('/documents/list.php', 'GET');
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load documents');
        }

        const docs = (data.data ?? []) as DocumentSummary[];
        setDocuments(docs);

        if (docs.length > 0) {
          setSelectedDocumentId(docs[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load document history');
      } finally {
        setLoadingState(false);
      }
    };

    void loadDocuments();
  }, [user, csrfCheckedRequest]);

  useEffect(() => {
    if (!selectedDocumentId || !user) {
      return;
    }

    let cancelled = false;

    const loadHistory = async () => {
      setLoadingState(true);
      setError(null);

      try {
        const response = await csrfCheckedRequest(
          `/documents/verification-history.php?id=${encodeURIComponent(selectedDocumentId)}`,
          'GET'
        );
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load verification history');
        }

        if (!cancelled) {
          setHistory((data.data ?? []) as VerificationLog[]);
        }
      } catch (err) {
        if (!cancelled) {
          setHistory([]);
          setError(err instanceof Error ? err.message : 'Unable to load verification history');
        }
      } finally {
        if (!cancelled) {
          setLoadingState(false);
        }
      }
    };

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [selectedDocumentId, user, csrfCheckedRequest]);

  const filteredHistory = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return history;
    }

    return history.filter((entry) => {
      const haystack = [
        entry.document_id,
        entry.reference_id,
        entry.verification_status,
        entry.file_name ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [history, search]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Verification History</h1>
            <p className="text-gray-600 mt-2">
              Review hash checks performed against trusted reference files.
            </p>
          </div>
          <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Trusted verification logs
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px] md:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Document</label>
              <select
                value={selectedDocumentId}
                onChange={(event) => {
                  setSelectedDocumentId(event.target.value);
                  setHistory([]);
                  setError(null);
                }}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                {documents.length === 0 ? (
                  <option value="">No documents available</option>
                ) : (
                  documents.map((document) => (
                    <option key={document.id} value={document.id}>
                      {document.filename}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Filter log entries"
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Verified at</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Hash result</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Signature</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Calculated SHA-256</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Expected SHA-256</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">File / size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loadingState ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading verification logs...
                      </div>
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                      No verification history available for this document.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(entry.verified_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{entry.reference_id}</td>
                      <td className="px-6 py-4 text-sm">
                        <StatusBadge status={entry.verification_status} />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <StatusBadge status={entry.signature_status ?? 'NOT_RECORDED'} />
                      </td>
                      <td className="max-w-xs break-all px-6 py-4 font-mono text-xs text-gray-700">
                        {entry.calculated_sha256 ?? 'Not captured (legacy record)'}
                      </td>
                      <td className="max-w-xs break-all px-6 py-4 font-mono text-xs text-gray-700">
                        {entry.expected_sha256 ?? 'Not captured (legacy record)'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{entry.reason_code ?? 'Not recorded'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {entry.file_name ?? 'Unknown file'}
                        <div className="text-xs text-gray-500">
                          {typeof entry.file_size === 'number' ? `${entry.file_size.toLocaleString()} bytes` : 'Size not recorded'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationHistory;
