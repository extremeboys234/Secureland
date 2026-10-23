import React, { useState } from 'react';
import { User } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  documentId: string;
  ipAddress: string;
  result: 'Success' | 'Failure';
}

const AuditLogs: React.FC = () => {
  const [filters, setFilters] = useState({
    date: '',
    action: '',
    result: ''
  });
  const [logs] = useState<AuditLogEntry[]>([
    {
      id: 'al_001',
      timestamp: '2026-09-16 10:30:45',
      user: 'john.doe@example.com',
      action: 'Document uploaded',
      documentId: 'DOC_12345',
      ipAddress: '192.168.1.100',
      result: 'Success'
    },
    {
      id: 'al_002',
      timestamp: '2026-09-16 10:25:30',
      user: 'admin@secureland.com',
      action: 'User created',
      documentId: '-',
      ipAddress: '192.168.1.105',
      result: 'Success'
    },
    {
      id: 'al_003',
      timestamp: '2026-09-16 10:20:15',
      user: 'jane.smith@example.com',
      action: 'Document verified',
      documentId: 'DOC_67890',
      ipAddress: '192.168.1.102',
      result: 'Failure'
    },
    {
      id: 'al_005',
      timestamp: '2026-09-16 10:10:20',
      user: 'john.doe@example.com',
      action: 'Document accessed',
      documentId: 'DOC_11111',
      ipAddress: '192.168.1.100',
      result: 'Success'
    },
    {
      id: 'al_006',
      timestamp: '2026-09-16 10:05:45',
      user: 'admin@secureland.com',
      action: 'Issuer disabled',
      documentId: '-',
      ipAddress: '192.168.1.105',
      result: 'Success'
    }
  ]);

  const filteredLogs = logs.filter(log => {
    if (filters.date && !log.timestamp.includes(filters.date)) return false;
    if (filters.action && log.action !== filters.action) return false;
    if (filters.result && log.result !== filters.result) return false;
    return true;
  });

  const getResultClass = (result: string) => {
    return result === 'Success'
      ? 'text-green-800 bg-green-100'
      : 'text-red-800 bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
        <p className="text-gray-600 mt-2">
          Security-focused audit trail of all system activities.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters(prev => ({...prev, date: e.target.value}))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters(prev => ({...prev, action: e.target.value}))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Actions</option>
                <option value="Document uploaded">Document uploaded</option>
                <option value="Document verified">Document verified</option>
                <option value="User created">User created</option>
                <option value="Document accessed">Document accessed</option>
                <option value="Issuer disabled">Issuer disabled</option>
                <option value="Document tampered detected">Document tampered detected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Result
              </label>
              <select
                value={filters.result}
                onChange={(e) => setFilters(prev => ({...prev, result: e.target.value}))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Results</option>
                <option value="Success">Success</option>
                <option value="Failure">Failure</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td className="px-6 py-4 text-center text-gray-500" colSpan={6}>
                      No audit log entries found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">{log.timestamp}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 flex items-center space-x-3">
                        <User className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{log.user.split('@')[0]}</p>
                          <p className="text-xs text-gray-500">{log.user}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">{log.action}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-mono">{log.documentId}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{log.ipAddress}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getResultClass(log.result)}`}>
                          {log.result}
                        </span>
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

export default AuditLogs;
