import React, { useState } from 'react';
import {
  CheckCircle,
  Loader2,
  FileText,
  Zap
} from 'lucide-react';
import Button from '../components/Button';
import FileUpload from '../components/FileUpload';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authService';

const UploadDocument: React.FC = () => {
  const { csrfProtectedRequest, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'upload' | 'processing' | 'success'>('upload');
  const [documentInfo, setDocumentInfo] = useState({
    name: '',
    type: 'Sale Deed',
    propertyId: '',
    documentNumber: '',
    issuingAuthority: '',
    issueDate: '',
    ownerName: '',
    location: '',
    description: '',
    authorized: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    documentId: string;
    sha256Hash: string;
    timestamp: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const { name } = target;
    const checked = 'checked' in target ? target.checked : false;
    setDocumentInfo(prev => ({
      ...prev,
      [name]: target instanceof HTMLInputElement && target.type === 'checkbox' ? !!checked : target.value
    }));
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setUploadError('Unsupported file type. Please upload PDF, JPEG, or PNG.');
      return;
    }
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setUploadError('File size exceeds 10 MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('name', documentInfo.name);
    formData.append('type', documentInfo.type);
    formData.append('propertyId', documentInfo.propertyId);
    formData.append('documentNumber', documentInfo.documentNumber);
    formData.append('issuingAuthority', documentInfo.issuingAuthority);
    formData.append('issueDate', documentInfo.issueDate);
    formData.append('ownerName', documentInfo.ownerName);
    formData.append('location', documentInfo.location);
    formData.append('description', documentInfo.description);
    formData.append('authorized', documentInfo.authorized ? 'on' : 'off');

    try {
      setStep('processing');
      const response = await csrfProtectedRequest(
        '/documents/upload.php',
        'POST',
        formData
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadResult({
        documentId: data.data.documentId,
        sha256Hash: data.data.sha256Hash,
        timestamp: data.data.timestamp
      });
      setStep('success');
    } catch (err: any) {
      setStep('upload');
      setUploadError(err.message || 'An unexpected error occurred');
    }
  };

  switch (step) {
    case 'processing':
      return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-xl p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Processing Document</h2>
            <div className="space-y-6">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Please wait while we secure your document</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FileText className="h-4 w-4 text-blue-500 mt-1 mr-3" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Validating uploaded file</p>
                    <p className="text-xs text-gray-500">Checking the file type and upload details</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Zap className="h-4 w-4 text-blue-500 mt-1 mr-3" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Generating SHA-256 hash</p>
                    <p className="text-xs text-gray-500">Creating unique fingerprint for integrity verification</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-blue-500 mt-1 mr-3" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Storing document</p>
                    <p className="text-xs text-gray-500">Saving the file in protected server-side storage</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    case 'success':
      if (!uploadResult) {
        return null;
      }
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-800">Upload Successful</h2>
                <p className="text-gray-600 mt-2">
                  Your document is stored in protected server-side storage. Its SHA-256 hash is shown below.
                </p>
              </div>

              <div className="space-y-6">
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Document Details</h3>
                  <dl className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <dt className="text-gray-500">Document ID</dt>
                      <dd className="text-gray-800 font-mono">{uploadResult.documentId}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">SHA-256 Hash</dt>
                      <dd className="flex items-center space-x-3">
                        <span className="text-gray-800 font-mono">{uploadResult.sha256Hash}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(uploadResult.sha256Hash);
                            alert('Hash copied to clipboard');
                          }}
                        >
                          Copy
                        </Button>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Digital Signature</dt>
                      <dd className="flex items-center">
                        <span className="text-amber-700">Not validated (signature inspection unavailable)</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Storage</dt>
                      <dd className="text-gray-800">Protected server-side storage</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Timestamp</dt>
                      <dd className="text-gray-800">{uploadResult.timestamp}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="mt-8">
                <Button
                  variant="secondary"
                  onClick={() => {
                    navigate(`/document/${uploadResult.documentId}`);
                  }}
                >
                  View Document Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('upload');
                    setDocumentInfo({
                      name: '',
                      type: 'Sale Deed',
                      propertyId: '',
                      documentNumber: '',
                      issuingAuthority: '',
                      issueDate: '',
                      ownerName: '',
                      location: '',
                      description: '',
                      authorized: false
                    });
                    setSelectedFile(null);
                    setUploadResult(null);
                  }}
                  className="ml-4"
                >
                  Upload Another
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    case 'upload':
    default:
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Upload Property Document</h1>
              <p className="text-gray-600 mt-2">
                Upload a property document to securely register and verify its integrity.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <form onSubmit={handleSubmit} className="p-6">
                <div className="mb-6">
                  <FileUpload
                    onFileSelected={handleFileSelected}
                    acceptedTypes={['application/pdf', 'image/jpeg', 'image/png']}
                    maxSizeMB={10}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={documentInfo.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type
                    </label>
                    <select
                      name="type"
                      value={documentInfo.type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="Sale Deed">Sale Deed</option>
                      <option value="Title Deed">Title Deed</option>
                      <option value="Encumbrance Certificate">Encumbrance Certificate</option>
                      <option value="Land Record">Land Record</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property ID / Survey Number
                    </label>
                    <input
                      type="text"
                      name="propertyId"
                      value={documentInfo.propertyId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Number
                    </label>
                    <input
                      type="text"
                      name="documentNumber"
                      value={documentInfo.documentNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Issuing Authority
                    </label>
                    <input
                      type="text"
                      name="issuingAuthority"
                      value={documentInfo.issuingAuthority}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Issue Date
                    </label>
                    <input
                      type="date"
                      name="issueDate"
                      value={documentInfo.issueDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      name="ownerName"
                      value={documentInfo.ownerName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={documentInfo.location}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={documentInfo.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      name="authorized"
                      checked={documentInfo.authorized}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm text-gray-700">
                    I confirm that the uploaded document is an authorized record.
                  </div>
                </div>

                {uploadError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                    {uploadError}
                  </div>
                )}

                <div className="mt-8">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={authLoading}
                  >
                    Secure & Upload Document
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
  }

};

export default UploadDocument;
