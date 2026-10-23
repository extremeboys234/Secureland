import React from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Share2,
  Download
} from 'lucide-react';
import Button from '../components/Button';

const DocumentDetails: React.FC = () => {
  const { id } = useParams();

  // Special case: Introduction to MS DOS document
  const isIntroToMSDOS = id === 'intro-to-msdos';

  // Default document data (for Property_001.pdf and others)
  const defaultDocument = {
    id: 'DOC_12345',
    name: 'Property_001.pdf',
    type: 'Sale Deed',
    owner: 'John Doe',
    propertyId: 'PROP_789',
    documentNumber: 'DOC_2026_001',
    issuingAuthority: 'County Registrar Office',
    uploadDate: '2026-09-16',
    securityChecks: [
      { label: 'SHA-256 Hash', status: 'verified', value: 'a3f5...' },
      { label: 'Digital Signature', status: 'verified' },
      { label: 'Issuer Verification', status: 'verified' },
      { label: 'AES-256 Encryption', status: 'verified' },
      { label: 'Hash-Chain Integrity', status: 'verified' },
    ],
    status: 'AUTHENTIC & UNALTERED'
  };

  // Introduction to MS DOS document data
  const introToMSDOSDocument = {
    id: 'intro-to-msdos',
    name: 'Introduction-to-MSDOS.pdf',
    type: 'Historical Document',
    owner: 'Digital Archives',
    propertyId: 'HIST_001',
    documentNumber: 'HIST_MSDOS_001',
    issuingAuthority: 'Microsoft Corporation',
    uploadDate: '2026-09-16',
    securityChecks: [
      { label: 'SHA-256 Hash', status: 'verified', value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
      { label: 'Digital Signature', status: 'verified' },
      { label: 'Issuer Verification', status: 'verified' },
      { label: 'AES-256 Encryption', status: 'verified' },
      { label: 'Hash-Chain Integrity', status: 'verified' },
    ],
    status: 'AUTHENTIC & UNALTERED'
  };

  // Use the appropriate document data
  const document = isIntroToMSDOS ? introToMSDOSDocument : defaultDocument;
  const hashValue = isIntroToMSDOS ? 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' : 'a3f5...';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Property Document Details</h1>
          <p className="text-gray-600 mt-2">
            View detailed information and security verification of your property document.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Document Preview */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-center h-48">
                  <FileText className="h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">{document.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Download document
                    alert('Downloading document...');
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Document
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Share securely
                    alert('Sharing document securely...');
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Securely
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    // Verify again
                    alert('Verifying document again...');
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // View audit history
                    alert('Viewing audit history...');
                  }}
                >
                  View Audit History
                </Button>
              </div>
            </div>

            {/* Security Information Card */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Document Information</h3>
                <dl className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-500">Document ID</dt>
                    <dd className="text-gray-800 font-mono">{document.id}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Document Type</dt>
                    <dd className="text-gray-800">{document.type}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Owner</dt>
                    <dd className="text-gray-800">{document.owner}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Property ID</dt>
                    <dd className="text-gray-800">{document.propertyId}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Document Number</dt>
                    <dd className="text-gray-800">{document.documentNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Issuing Authority</dt>
                    <dd className="text-gray-800">{document.issuingAuthority}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Upload Date</dt>
                    <dd className="text-gray-800">{document.uploadDate}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Security Verification</h3>
                <div className="space-y-3">
                  {document.securityChecks.map((check, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      {check.status === 'verified' ? (
                        <CheckCircle className="h-4 w-4 mt-1 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mt-1 text-red-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{check.label}</p>
                        {check.value && (
                          <p className="text-sm text-gray-600">{check.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">Document Status</p>
                      <p className="text-lg font-bold text-green-600">{document.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SHA-256 Hash Copyable Field */}
        <div className="mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">SHA-256 Hash</p>
                <p className="text-gray-800 font-mono">{hashValue}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(hashValue);
                  alert('Hash copied to clipboard');
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetails;
