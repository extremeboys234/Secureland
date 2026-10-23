import React, { useState } from 'react';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';

interface ManagedDocument {
  id: string;
  name: string;
  type: string;
  owner: string;
  issuer: string;
  uploadDate: string;
  integrityStatus: 'Verified' | 'Pending' | 'Tampered' | 'Unknown Issuer';
}

const MOCK_DOCUMENTS: ManagedDocument[] = [
  { id: 'doc_001', name: 'Property_001.pdf', type: 'Sale Deed', owner: 'John Doe', issuer: 'County Registrar Office', uploadDate: '2026-09-16', integrityStatus: 'Verified' },
  { id: 'doc_002', name: 'Land_Record_02.pdf', type: 'Title Deed', owner: 'Jane Smith', issuer: 'County Registrar Office', uploadDate: '2026-09-15', integrityStatus: 'Pending' },
  { id: 'doc_003', name: 'EC_102.pdf', type: 'Encumbrance Certificate', owner: 'Bob Johnson', issuer: 'Unknown Authority', uploadDate: '2026-09-14', integrityStatus: 'Unknown Issuer' },
  { id: 'doc_004', name: 'Property_003.pdf', type: 'Sale Deed', owner: 'Alice Brown', issuer: 'County Registrar Office', uploadDate: '2026-09-13', integrityStatus: 'Tampered' },
];

const DocumentManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: ''
  });
  const documents = MOCK_DOCUMENTS;

  const filteredDocuments = documents.filter(doc => {
    if (search && !doc.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.type && doc.type !== filters.type) return false;
    if (filters.status && doc.integrityStatus !== filters.status) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Document Management</h1>
        <p className="text-gray-600 mt-2">
          View and manage all registered property documents.
        </p>
        <Button
          variant="primary"
          onClick={() => {
            // In a real app, this would navigate to upload document
            alert('Navigate to upload document');
          }}
        >
          Upload New Document
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({...prev, type: e.target.value}))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Types</option>
                <option value="Sale Deed">Sale Deed</option>
                <option value="Title Deed">Title Deed</option>
                <option value="Encumbrance Certificate">Encumbrance Certificate</option>
                <option value="Land Record">Land Record</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Integrity Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Tampered">Tampered</option>
                <option value="Unknown Issuer">Unknown Issuer</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setFilters({type: '', status: ''});
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>

          {/* Documents Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issuer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Integrity Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td className="px-6 py-4 text-center text-gray-500" colSpan={8}>
                      No documents found.
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800 font-mono">{doc.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{doc.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{doc.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{doc.owner}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{doc.issuer}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{doc.uploadDate}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={doc.integrityStatus} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 flex space-x-3">
                        <button
                          onClick={() => {
                            // View document
                            alert('View document: ' + doc.name);
                          }}
                          className="text-blue-600 hover:text-blue-500"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            // Verify document
                            alert('Verify document: ' + doc.name);
                          }}
                          className="text-green-600 hover:text-green-500"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            // Download document
                            alert('Download document: ' + doc.name);
                          }}
                          className="text-gray-600 hover:text-gray-500"
                        >
                          <Loader2 className="h-4 w-4" /> {/* Using Loader2 as download icon for now */}
                        </button>
                        <button
                          onClick={() => {
                            // View audit trail
                            alert('View audit trail for: ' + doc.name);
                          }}
                          className="text-gray-600 hover:text-gray-500"
                        >
                          <AlertTriangle className="h-4 w-4" /> {/* Using AlertTriangle as audit trail */}
                        </button>
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

export default DocumentManagement;
