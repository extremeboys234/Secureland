import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsCards from '../components/dashboard/StatsCards';
import QuickActions from '../components/dashboard/QuickActions';
import RecentDocuments, { type DashboardDocument } from '../components/dashboard/RecentDocuments';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useAuth } from '../services/authService';

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, csrfCheckedRequest } = useAuth();
  const [documents, setDocuments] = useState<DashboardDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    let cancelled = false;
    const loadDocuments = async () => {
      setDocumentsLoading(true);
      setDocumentsError(null);
      try {
        const response = await csrfCheckedRequest('/documents/list.php', 'GET');
        const result = await response.json() as ApiResponse<DashboardDocument[]>;
        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.error || 'Unable to load dashboard documents.');
        }
        if (!cancelled) {
          setDocuments(result.data);
        }
      } catch (error) {
        if (!cancelled) {
          setDocumentsError(error instanceof Error ? error.message : 'Unable to load dashboard documents.');
        }
      } finally {
        if (!cancelled) {
          setDocumentsLoading(false);
        }
      }
    };

    void loadDocuments();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, csrfCheckedRequest]);

  const matchedDocuments = documents.filter((document) => document.integrity_status === 'MATCH').length;
  const pendingDocuments = documents.filter((document) => document.approval_status === 'pending').length;
  const issueDocuments = documents.filter(
    (document) => document.integrity_status && document.integrity_status !== 'MATCH'
  ).length;
  const statValue = (value: number) => documentsLoading || documentsError ? '—' : value;

  return (
    <div className="app-layout">
      <Sidebar activeItem="dashboard" />
      <div className="app-main">
        <TopNav title="Dashboard" />
        <main className="app-content">
          <div className="app-content-inner">
            <div className="dashboard-intro">
              <div>
                <p className="dashboard-kicker">SECURE PROPERTY RECORDS</p>
                <h2>Good morning, Seba</h2>
                <p>Review and protect your property documents from one secure workspace.</p>
              </div>
              <div className="dashboard-actions">
                <button className="primary-btn" onClick={() => navigate('/upload')}>Upload Document</button>
              </div>
            </div>
            <StatsCards
              stats={[
                { label: 'Total Documents', value: statValue(documents.length), icon: 'FileText', color: 'blue' },
                { label: 'Hash Matches', value: statValue(matchedDocuments), icon: 'CheckCircle', color: 'green' },
                { label: 'Pending Verification', value: statValue(pendingDocuments), icon: 'Clock', color: 'yellow' },
                { label: 'Verification Issues', value: statValue(issueDocuments), icon: 'AlertTriangle', color: 'red' },
              ]}
            />
            {documentsError && (
              <p role="alert" className="text-sm text-red-700">{documentsError}</p>
            )}
            <QuickActions
              actions={[
                {
                  title: 'Upload Document',
                  description: 'Upload a new property document.',
                  icon: 'Upload',
                  onClick: () => navigate('/upload'),
                  color: 'blue'
                }
              ]}
            />
            {user && <RecentDocuments key={user.id} documents={documents} loading={documentsLoading} userId={user.id} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;