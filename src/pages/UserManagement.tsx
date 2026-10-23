import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import Button from '../components/Button';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  created: string;
}

const MOCK_USERS: User[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@example.com', role: 'Property Buyer', status: 'Active', created: '2026-09-01' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Seller', status: 'Active', created: '2026-09-05' },
  { id: '3', name: 'Robert Johnson', email: 'robert.johnson@example.com', role: 'Bank/NBFC Officer', status: 'Active', created: '2026-09-10' },
  { id: '4', name: 'Maria Garcia', email: 'maria.garcia@example.com', role: 'Lawyer', status: 'Inactive', created: '2026-09-12' },
  { id: '5', name: 'Admin User', email: 'admin@secureland.com', role: 'Admin', status: 'Active', created: '2026-08-01' },
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: string;
    status: 'Active' | 'Inactive';
  }>({
    name: '',
    email: '',
    role: 'Property Buyer',
    status: 'Active'
  });

  const handleOpenModal = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Property Buyer',
      status: 'Active'
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would send this to the backend
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      status: formData.status,
      created: new Date().toISOString().split('T')[0]
    };
    setUsers(prev => [...prev, newUser]);
    handleCloseModal();
  };

  const handleToggleStatus = (user: User) => {
    setUsers(prev => prev.map(u =>
      u.id === user.id ? {...u, status: u.status === 'Active' ? 'Inactive' : 'Active'} : u
    ));
  };

  const handleDelete = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage user accounts and roles in the SecureLand system.
        </p>
        <Button
          variant="primary"
          onClick={handleOpenModal}
          className="mt-4"
        >
          <Plus className="mr-2" />
          Add New User
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-800 flex items-center space-x-3">
                    <Users className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 capitalize">{user.role}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`px-3 py-1 text-xs font-medium rounded-full ${user.status === 'Active'
                        ? 'text-green-800 bg-green-100 hover:bg-green-200'
                        : 'text-red-800 bg-red-100 hover:bg-red-200'}`}
                    >
                      {user.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{user.created}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 flex space-x-3">
                    <button
                      onClick={() => {
                        // Edit user
                        alert('Edit user: ' + user.name);
                      }}
                      className="text-blue-600 hover:text-blue-500"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-500"
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

      {/* Add User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add New User</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
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
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="Property Buyer">Property Buyer</option>
                  <option value="Seller">Seller</option>
                  <option value="Bank/NBFC Officer">Bank/NBFC Officer</option>
                  <option value="Lawyer">Lawyer</option>
                  <option value="Registrar/Authority">Registrar/Authority</option>
                  <option value="Verification Officer">Verification Officer</option>
                  <option value="Admin">Admin</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select the user's role in the system
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as 'Active' | 'Inactive'})}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="Active">Active</option>
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
                  Add User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
