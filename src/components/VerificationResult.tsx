import React from 'react';
import { CheckCircle, AlertTriangle, User } from 'lucide-react';

interface VerificationResultProps {
  result: {
    status: 'authentic' | 'tampered' | 'unknown-issuer';
    details: {
      identity: string;
      hashMatch: string;
      signature: string;
      issuer: string;
      hashChain: string;
    };
  };
}

const VerificationResult: React.FC<VerificationResultProps> = ({ result }) => {
  const { status, details } = result;

  const getResultInfo = () => {
    switch (status) {
      case 'authentic':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-600" />,
          title: 'AUTHENTIC & UNALTERED',
          subtitle: 'The document is authentic and has not been tampered with.',
          color: 'text-green-600 bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'tampered':
        return {
          icon: <AlertTriangle className="h-8 w-8 text-red-600" />,
          title: 'DOCUMENT TAMPERED',
          subtitle: 'The document has been altered and is not authentic.',
          color: 'text-red-600 bg-red-50',
          borderColor: 'border-red-200',
        };
      case 'unknown-issuer':
        return {
          icon: <User className="h-8 w-8 text-orange-600" />,
          title: 'UNKNOWN ISSUER',
          subtitle: 'The document issuer could not be verified.',
          color: 'text-orange-600 bg-orange-50',
          borderColor: 'border-orange-200',
        };
      default:
        return {
          icon: <CheckCircle className="h-8 w-8 text-gray-600" />,
          title: 'VERIFICATION COMPLETE',
          subtitle: 'The verification process has been completed.',
          color: 'text-gray-600 bg-gray-50',
          borderColor: 'border-gray-200',
        };
    }
  };

  const { icon, title, subtitle, color, borderColor } = getResultInfo();

  return (
    <div className={`rounded-xl shadow-sm border ${borderColor} ${color} p-6`}>
      <div className="flex items-center space-x-4 mb-6">
        {icon}
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-600">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-left">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Verification Details</h3>
          <dl className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Document identity</dt>
              <dd className="text-gray-800">{details.identity}</dd>
            </div>
            <div>
              <dt className="text-gray-500">SHA-256 hash</dt>
              <dd className="text-gray-800">{details.hashMatch}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Digital signature</dt>
              <dd className="text-gray-800">{details.signature}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Issuer verification</dt>
              <dd className="text-gray-800">{details.issuer}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Hash-chain integrity</dt>
              <dd className="text-gray-800">{details.hashChain}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6">
          <button
            onClick={() => {
              // In a real app, this would navigate to document details or verification history
              alert('Viewing verification details...');
            }}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Verification Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationResult;
