import React, { useState, useEffect } from 'react';
import {
  FileText,
  Loader2,
  Circle,
} from 'lucide-react';
import { useAuth } from '../services/authService';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useNavigate } from 'react-router-dom';

const DocumentListPage: React.FC = () => {
  const { csrfProtectedRequest, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    const loadDocuments = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await csrfProtectedRequest(
          '/documents/list.php',
          'GET'
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load documents');
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to load documents');
        }

        setDocuments(data.data || []);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
        console.error('Error loading documents:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [authLoading, user, csrfProtectedRequest, navigate]);

  const handleDownload = async (documentId: string) => {
    try {
      const response = await csrfProtectedRequest(
        `/documents/download.php?id=${documentId}`,
        'GET'
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Try to get filename from headers or use documentId
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `document_${documentId}`;
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (matches?.[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during download');
      console.error('Error downloading document:', err);
    }
  };

  const handleViewDetails = (documentId: string) => {
    navigate(`/document/${documentId}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FileText className="mr-3 h-5 w-5" />
            My Documents
          </h1>
          <p className="text-gray-600 mt-2">
            View and manage your securely stored property documents.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setError(null)}
              className="ml-4"
            >
              Dismiss
            </Button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-6 w-6 text-blue-500 mx-auto mb-3 animate-spin" />
            <p className="text-gray-600">Loading your documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <Circle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No documents yet
            </h3>
            <p className="text-gray-500">
              Upload your first property document to get started.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/upload')}
            >
              Upload First Document
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <FileText className="h-5 w-5 text-blue-500 mt-1" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-1">
                          {doc.filename}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Uploaded: {new Date(doc.upload_date).toLocaleDateString()}
                        </p>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Circle className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600">
                            Property / survey ID: {doc.property_id || 'Not provided'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Circle className="h-3 w-3 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              ID: {doc.id.substring(0, 8)}...
                            </span>
                          </div>
                          <StatusBadge
                            status={
                              doc.approval_status === 'approved'
                                ? 'Verified'
                                : doc.approval_status === 'rejected'
                                  ? 'Rejected'
                                  : 'Pending Verification'
                            }
                          />
                          {doc.integrity_status && (
                            <div className="text-xs text-gray-600">
                              Hash integrity: <StatusBadge status={doc.integrity_status} size="sm" />
                            </div>
                          )}
                          {doc.approval_status === 'rejected' && doc.review_note && (
                            <p className="text-sm text-red-700">Reason: {doc.review_note}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(doc.id)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownload(doc.id)}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentListPage;