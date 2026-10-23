import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock3, XCircle } from 'lucide-react';

export interface DashboardDocument {
  id: string;
  filename: string;
  upload_date: string | null;
  integrity_status: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  review_note: string | null;
  document_number?: string | null;
  property_id?: string | null;
}

interface RecentDocumentsProps {
  documents: DashboardDocument[];
  loading: boolean;
  userId: number;
}

interface RecentDocumentsPreferences {
  hiddenDocumentIds: string[];
  storageWarning: string | null;
}

const RecentDocuments: React.FC<RecentDocumentsProps> = ({ documents, loading, userId }) => {
  const navigate = useNavigate();
  const storageKey = `secureland:hidden-recent-documents:${userId}`;
  const [preferences, setPreferences] = useState<RecentDocumentsPreferences>(() => {
    try {
      const savedIds = window.localStorage.getItem(storageKey);
      const parsedIds: unknown = savedIds ? JSON.parse(savedIds) : [];
      if (!Array.isArray(parsedIds) || !parsedIds.every((id) => typeof id === 'string')) {
        throw new Error('Saved hidden-document preferences are invalid.');
      }
      return { hiddenDocumentIds: parsedIds, storageWarning: null };
    } catch {
      return {
        hiddenDocumentIds: [],
        storageWarning: 'Could not load saved Recent Documents preferences; hidden items may reappear after refresh.',
      };
    }
  });
  const { hiddenDocumentIds, storageWarning } = preferences;

  const handleViewDocument = (docId: string) => {
    navigate(`/document/${docId}`);
  };

  const handleRemoveDocument = (docId: string) => {
    const nextHiddenIds = [...new Set([...hiddenDocumentIds, docId])];
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextHiddenIds));
      setPreferences({ hiddenDocumentIds: nextHiddenIds, storageWarning: null });
    } catch {
      setPreferences({
        hiddenDocumentIds: nextHiddenIds,
        storageWarning: 'Removed from this view, but the preference could not be saved for the next visit.',
      });
    }
  };

  const recentDocuments = documents.filter((doc) => !hiddenDocumentIds.includes(doc.id)).slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Recent Documents</h3>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/documents');
          }}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          View All
        </a>
      </div>
      {storageWarning && (
        <p role="alert" className="px-6 pt-3 text-xs text-amber-800">{storageWarning}</p>
      )}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <p className="px-6 py-4 text-sm text-gray-500">Loading your documents...</p>
        ) : recentDocuments.length === 0 ? (
          <p className="px-6 py-4 text-sm text-gray-500">No uploaded documents yet.</p>
        ) : recentDocuments.map((doc) => (
          <div key={doc.id} className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{doc.filename}</p>
                <p className="text-xs text-gray-500 truncate">
                  {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'Upload date unavailable'}
                </p>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center text-xs font-medium ${
                  doc.approval_status === 'approved'
                    ? 'text-green-700'
                    : doc.approval_status === 'rejected'
                    ? 'text-red-700'
                    : 'text-amber-700'
                }`}>
                  {doc.approval_status === 'approved'
                    ? <CheckCircle className="mr-1 h-4 w-4" />
                    : doc.approval_status === 'rejected'
                    ? <XCircle className="mr-1 h-4 w-4" />
                    : <Clock3 className="mr-1 h-4 w-4" />}
                  {doc.approval_status === 'approved'
                    ? 'Verified'
                    : doc.approval_status === 'rejected'
                    ? 'Rejected'
                    : 'Pending Verification'}
                </div>
                {doc.integrity_status && (
                  <p className={`mt-1 text-xs ${
                    doc.integrity_status === 'MATCH' ? 'text-green-700' :
                      doc.integrity_status === 'MISMATCH' ? 'text-red-700' : 'text-gray-600'
                  }`}>
                    Hash: {doc.integrity_status === 'MATCH' ? 'Match' : doc.integrity_status === 'MISMATCH' ? 'Mismatch' : doc.integrity_status.replaceAll('_', ' ')}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleViewDocument(doc.id)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                View
              </button>
              <button
                type="button"
                onClick={() => handleRemoveDocument(doc.id)}
                aria-label={`Remove ${doc.filename} from Recent Documents`}
                className="text-sm text-gray-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
            {doc.approval_status === 'rejected' && doc.review_note && (
              <p className="mt-2 text-xs text-red-700">Reason: {doc.review_note}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentDocuments;
