import React, { useState, useEffect } from 'react';
import {
  FileText,
  Loader2,
  CheckCircle,
  ShieldCheck,
  Folder,
  Calendar,
  User,
  BarChart2
} from 'lucide-react';
import { useAuth } from '../services/authService';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useParams, useNavigate } from 'react-router-dom';

interface StoredDocument {
  id: string;
  filename: string;
  actual_filename: string;
  sha256_hash: string;
  upload_date: string;
  processing_status: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  integrity_status: string | null;
  user_id: number | null;
  document_number: string | null;
  property_id: string | null;
  owner_name: string | null;
  issuing_authority: string | null;
  issue_date: string | null;
  description: string | null;
  review_note: string | null;
  reviewed_at: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

const DocumentDetailsPage: React.FC = () => {
  const { csrfProtectedRequest, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<StoredDocument | null>(null);
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

    if (!id) {
      return;
    }

    const loadDocumentDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await csrfProtectedRequest(
          `/documents/get.php?id=${id}`,
          'GET'
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load document details');
        }

        const data = await response.json() as ApiResponse<StoredDocument>;
        if (!data.success) {
          throw new Error(data.error || 'Failed to load document details');
        }

        if (!data.data) {
          throw new Error('The document service returned no document details.');
        }

        setDocument(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        console.error('Error loading document details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDocumentDetails();
  }, [authLoading, user, id, csrfProtectedRequest, navigate]);

  const handleDownload = async () => {
    if (!document) return;

    try {
      const response = await csrfProtectedRequest(
        `/documents/download.php?id=${id}`,
        'GET'
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      // Try to get filename from headers or use documentId
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `document_${id}`;
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (matches?.[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      a.download = filename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during download');
      console.error('Error downloading document:', err);
    }
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

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          Document ID is required.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <Loader2 className="h-6 w-6 text-blue-500 mx-auto mb-3 animate-spin" />
            <p className="text-gray-600">Loading document details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-4">Error Loading Document</h2>
            <p>{error}</p>
            <Button
              variant="outline"
              onClick={() => navigate('/documents')}
              className="mr-2"
            >
              Back to Documents
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Document Not Found</h2>
            <p className="text-gray-600">
              The requested document could not be found or you don't have access to it.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/documents')}
            >
              Back to Documents
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="mb-6 pb-5 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {document.filename}
                </h1>
                <p className="text-gray-600">
                  Property Document • {new Date(document.upload_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Document Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Processing</span>
                    <StatusBadge status={document.processing_status ?? 'pending'} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Approval</span>
                    <StatusBadge
                      status={
                        document.approval_status === 'approved'
                          ? 'Verified'
                          : document.approval_status === 'rejected'
                            ? 'Rejected'
                            : 'Pending Verification'
                      }
                    />
                  </div>
                  {document.integrity_status !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Integrity</span>
                      <StatusBadge status={document.integrity_status ?? 'pending'}>
                        {document.integrity_status}
                      </StatusBadge>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Document Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Folder className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-sm font-medium text-gray-600">Stored As</span>
                      <p className="text-xs text-gray-400 font-mono break-all">
                        {document.actual_filename}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-sm font-medium text-gray-600">Upload Date</span>
                      <p className="text-xs text-gray-400">
                        {new Date(document.upload_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-sm font-medium text-gray-600">Owner ID</span>
                      <p className="text-xs text-gray-400">
                        {document.user_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 md:col-span-2 lg:col-span-3">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Submitted Property Details</h3>
                  <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div><dt className="text-xs font-medium text-gray-500">Document number</dt><dd className="text-sm text-gray-800">{document.document_number || 'Not provided'}</dd></div>
                    <div><dt className="text-xs font-medium text-gray-500">Property / survey ID</dt><dd className="text-sm text-gray-800">{document.property_id || 'Not provided'}</dd></div>
                    <div><dt className="text-xs font-medium text-gray-500">Owner name</dt><dd className="text-sm text-gray-800">{document.owner_name || 'Not provided'}</dd></div>
                    <div><dt className="text-xs font-medium text-gray-500">Issuing authority</dt><dd className="text-sm text-gray-800">{document.issuing_authority || 'Not provided'}</dd></div>
                    <div><dt className="text-xs font-medium text-gray-500">Issue date</dt><dd className="text-sm text-gray-800">{document.issue_date || 'Not provided'}</dd></div>
                    <div><dt className="text-xs font-medium text-gray-500">Reviewed at</dt><dd className="text-sm text-gray-800">{document.reviewed_at ? new Date(document.reviewed_at).toLocaleString() : 'Not reviewed'}</dd></div>
                    {document.description && <div className="sm:col-span-2 lg:col-span-3"><dt className="text-xs font-medium text-gray-500">Description</dt><dd className="whitespace-pre-wrap text-sm text-gray-800">{document.description}</dd></div>}
                    {document.approval_status === 'rejected' && document.review_note && (
                      <div className="sm:col-span-2 lg:col-span-3" role="status">
                        <dt className="text-xs font-medium text-red-700">Review reason</dt>
                        <dd className="whitespace-pre-wrap text-sm text-red-800">{document.review_note}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Security & Integrity</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <ShieldCheck className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-sm font-medium text-gray-600">Storage</span>
                      <p className="text-xs text-gray-400">Protected server-side directory</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-sm font-medium text-gray-600">Tamper Evident</span>
                      <p className="text-xs text-gray-400">SHA-256 Hash</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <BarChart2 className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-sm font-medium text-gray-600">Hash Value</span>
                      <p className="text-xs text-gray-400 font-mono truncate" title={document.sha256_hash}>
                        {document.sha256_hash}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/documents')}
                >
                  Back to Documents
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDownload}
                >
                  Download Document
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailsPage;
