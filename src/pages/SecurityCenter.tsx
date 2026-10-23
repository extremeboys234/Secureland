import React from 'react';
import {
  Zap,
  ShieldCheck,
  Lock,
  Link2,
  Users,
  CheckCircle
} from 'lucide-react';

const SecurityCenter: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Security Center</h1>
        <p className="text-gray-600 mt-2">
          Overview of the integrity checks and access controls implemented in this build.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Security Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* SHA-256 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Zap className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">SHA-256</h3>
                <p className="text-sm text-gray-600">
                  Document fingerprinting and integrity verification.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                Verification recalculates the stored file's SHA-256 hash and compares it with an active trusted reference.
                A match confirms byte equality only; it does not prove ownership or legal authenticity.
              </p>
              <div className="flex items-center space-x-3 mt-2 p-3 bg-blue-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-800">Server-side hash comparison</span>
              </div>
            </div>
          </div>

          {/* Digital Signature */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <ShieldCheck className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">PDF Digital Signatures</h3>
                <p className="text-sm text-gray-600">
                  Signature inspection is unavailable in this build.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                PDF signature parsing, cryptographic validation, and issuer-certificate trust checks are not implemented.
                No signature validity or issuer-authenticity result is produced.
              </p>
              <div className="flex items-center space-x-3 mt-2 p-3 bg-amber-50 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Validation unavailable</span>
              </div>
            </div>
          </div>

          {/* Protected storage */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Lock className="h-8 w-8 text-purple-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Protected Server-Side Storage</h3>
                <p className="text-sm text-gray-600">
                  Stored outside the public web directory.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                Document files are stored outside the public web directory and served through an authenticated endpoint.
                At-rest encryption is not implemented in this build.
              </p>
              <div className="flex items-center space-x-3 mt-2 p-3 bg-purple-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-800">Protected storage path</span>
              </div>
            </div>
          </div>

          {/* Verification history */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Link2 className="h-8 w-8 text-orange-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Verification History</h3>
                <p className="text-sm text-gray-600">
                  Verification attempts are stored for authorized retrieval.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                Each attempt stores the calculated and expected hash snapshots, signature-validation availability, and a safe reason code.
                This history is not a blockchain or immutable hash chain.
              </p>
              <div className="flex items-center space-x-3 mt-2 p-3 bg-orange-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-800">Persisted verification records</span>
              </div>
            </div>
          </div>

          {/* Role-Based Access Control */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Users className="h-8 w-8 text-indigo-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Role-Based Access Control</h3>
                <p className="text-sm text-gray-600">
                  Ensures users can access only authorized information.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                User and administrator roles restrict access to administration features. Document details, downloads,
                and verification history are limited to the owner or an administrator.
              </p>
              <div className="flex items-center space-x-3 mt-2 p-3 bg-indigo-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium text-indigo-800">Least privilege</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Features Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">How SecureLand Works</h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>
              An uploaded PDF or image is stored outside the public web directory and assigned a SHA-256 hash
            </li>
            <li>
              An administrator manages validated trusted-reference activation
            </li>
            <li>
              The server recalculates the stored file hash and compares it with the selected active reference
            </li>
            <li>
              The result and available hash snapshots are recorded in verification history
            </li>
            <li>
              PDF digital-signature validation is unavailable and no result is inferred from the hash comparison
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SecurityCenter;
