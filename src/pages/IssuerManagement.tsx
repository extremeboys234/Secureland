import React, { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import Button from '../components/Button';

interface Issuer {
  id: string;
  name: string;
  organization: string;
  issuerId: string;
  publicKey: string;
  status: 'Trusted' | 'Inactive';
  addedDate: string;
}

const MOCK_ISSUERS: Issuer[] = [
  {
    id: 'issuer_001',
    name: 'County Registrar Office',
    organization: 'Government of State',
    issuerId: 'CRO_001',
    publicKey: '-----BEGIN PUBLIC KEY-----\\nMIIBIjANBgkqh...',
    status: 'Trusted',
    addedDate: '2026-09-01',
  },
  {
    id: 'issuer_002',
    name: 'City Municipal Corporation',
    organization: 'Local Government',
    issuerId: 'CMC_002',
    publicKey: '-----BEGIN PUBLIC KEY-----\\nMIIBIjANBgkqh...',
    status: 'Trusted',
    addedDate: '2026-09-05',
  },
  {
    id: 'issuer_003',
    name: 'National Bank',
    organization: 'Financial Institution',
    issuerId: 'NB_003',
    publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqh...',
    status: 'Inactive',
    addedDate: '2026-08-15',
  },
];

const IssuerManagement: React.FC = () => {
  const [issuers, setIssuers] = useState<Issuer[]>(MOCK_ISSUERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    organization: string;
    issuerId: string;
    publicKey: string;
    status: 'Trusted' | 'Inactive';
  }>({
    name: '',
    organization: '',
    issuerId: '',
    publicKey: '',
    status: 'Trusted'
  });

  const handleOpenModal = () => {
    setFormData({
      name: '',
      organization: '',
      issuerId: '',
      publicKey: '',
      status: 'Trusted'
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would send this to the backend
    const newIssuer: Issuer = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      organization: formData.organization,
      issuerId: formData.issuerId,
      publicKey: formData.publicKey,
      status: formData.status,
      addedDate: new Date().toISOString().split('T')[0]
    };
    setIssuers(prev => [...prev, newIssuer]);
    handleCloseModal();
  };

  const handleToggleStatus = (issuer: Issuer) => {
    setIssuers(prev => prev.map(i =>
      i.id === issuer.id ? {...i, status: i.status === 'Trusted' ? 'Inactive' : 'Trusted'} : i
    ));
  };

  const handleVerify = (issuer: Issuer) => {
    // In a real app, this would verify the issuer's credentials
    alert(`Verifying issuer: ${issuer.name}`);
  };

  const handleDelete = (id: string) => {
    setIssuers(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Issuer Management</h1>
        <p className="text-gray-600 mt-2">
          Manage trusted document issuers in the SecureLand system.
        </p>
        <Button
          variant="primary"
          onClick={handleOpenModal}
          className="mt-4"
        >
          <Plus className="mr-2" />
          Add New Issuer
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issuer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issuer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Public Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {issuers.map((issuer) => (
                <tr key={issuer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800">{issuer.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{issuer.organization}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-mono">{issuer.issuerId}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-xs">{issuer.publicKey.substring(0, 20)}...</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(issuer)}
                      className={`px-3 py-1 text-xs font-medium rounded-full ${issuer.status === 'Trusted'
                        ? 'text-green-800 bg-green-100 hover:bg-green-200'
                        : 'text-red-800 bg-red-100 hover:bg-red-200'}`}
                    >
                      {issuer.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{issuer.addedDate}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 flex space-x-3">
                    <button
                      onClick={() => handleVerify(issuer)}
                      className="text-blue-600 hover:text-blue-500"
                    >
                      <ShieldCheck className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        // Edit issuer
                        alert('Edit issuer: ' + issuer.name);
                      }}
                      className="text-blue-600 hover:text-blue-500 ml-2"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(issuer.id)}
                      className="text-red-600 hover:text-red-500 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Issuer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Issuer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuer Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issuer ID
                </label>
                <input
                  type="text"
                  value={formData.issuerId}
                  onChange={(e) => setFormData({...formData, issuerId: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public Key
                </label>
                <textarea
                  value={formData.publicKey}
                  onChange={(e) => setFormData({...formData, publicKey: e.target.value})}
                  rows={4}
                  placeholder="Enter the issuer's public key"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Format: PEM encoded public key
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'Trusted' | 'Inactive'})}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="Trusted">Trusted</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                >
                  Add Issuer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssuerManagement;
