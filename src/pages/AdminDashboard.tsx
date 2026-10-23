import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import StatsCards from '../components/dashboard/StatsCards';
import { Link } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { useAuth } from '../services/authService';

interface AdminStatistics {
  total_users: number;
  total_documents: number;
  approved_documents: number;
  failed_verification_attempts: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

const AdminDashboard: React.FC = () => {
  const { csrfCheckedRequest } = useAuth();
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadStatistics = async () => {
      try {
        const response = await csrfCheckedRequest('/admin/stats.php', 'GET');
        const result = await response.json() as ApiResponse<AdminStatistics>;
        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.error || 'Unable to load dashboard statistics.');
        }
        if (active) {
          setStatistics(result.data);
          setStatisticsError(null);
        }
      } catch (error) {
        if (active) {
          setStatisticsError(error instanceof Error ? error.message : 'Unable to load dashboard statistics.');
        }
      }
    };
    void loadStatistics();
    return () => {
      active = false;
    };
  }, [csrfCheckedRequest]);

  const statValue = (value: number | undefined) =>
    statisticsError || value === undefined ? '—' : value;

  return (
    <div className="app-layout">
      <Sidebar activeItem="admin-dashboard" />
      <div className="app-main">
        <TopNav title="Admin Dashboard" />
        <main className="app-content">
          <div className="app-content-inner">
            <Link
              to="/admin/pending-verification"
              className="mb-6 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-900 hover:bg-blue-100"
            >
              <span>
                <span className="block text-lg font-semibold">Pending Document Verification</span>
                <span className="mt-1 block text-sm">Review uploaded documents, compare hashes, and record decisions.</span>
              </span>
              <ClipboardCheck className="h-6 w-6" />
            </Link>
            <StatsCards
              stats={[
                { label: 'Total Users', value: statValue(statistics?.total_users), icon: 'Users', color: 'blue' },
                { label: 'Total Documents', value: statValue(statistics?.total_documents), icon: 'FileText', color: 'green' },
                { label: 'Approved Documents', value: statValue(statistics?.approved_documents), icon: 'CheckCircle', color: 'green' },
                { label: 'Failed Verification Attempts', value: statValue(statistics?.failed_verification_attempts), icon: 'AlertTriangle', color: 'red' },
              ]}
            />
            {statisticsError && <p role="alert" className="text-sm text-red-700">{statisticsError}</p>}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
