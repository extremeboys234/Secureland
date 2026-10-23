import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminDocumentReview from './pages/AdminDocumentReview';
import Login from './pages/Login';
import UploadDocument from './pages/UploadDocument';
import DocumentDetails from './pages/DocumentDetailsPage';
import VerificationHistory from './pages/VerificationHistory';
import DocumentListPage from './pages/DocumentListPage';
import UserManagement from './pages/UserManagement';
import DocumentManagement from './pages/DocumentManagement';
import IssuerManagement from './pages/IssuerManagement';
import AuditLogs from './pages/AuditLogs';
import SecurityCenter from './pages/SecurityCenter';
import TrustedReferenceManagement from './pages/TrustedReferenceManagement';
import { useAuth } from './services/authService';

function RequireAuth({ children, isAuthenticated }: { children: ReactNode; isAuthenticated: boolean }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RequireAdmin({ children, isAdmin }: { children: ReactNode; isAdmin: boolean }) {
  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  const { user, loading } = useAuth();

  // While loading auth state, show a loading indicator or just prevent routing
  if (loading) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<div>Loading...</div>} />
        </Routes>
      </BrowserRouter>
    );
  }

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<RequireAuth isAuthenticated={isAuthenticated}><UserDashboard /></RequireAuth>} />
        <Route path="/admin/dashboard" element={<RequireAdmin isAdmin={isAdmin}><AdminDashboard /></RequireAdmin>} />
        <Route path="/admin/pending-verification" element={<RequireAdmin isAdmin={isAdmin}><AdminDocumentReview /></RequireAdmin>} />
        <Route path="/upload" element={<RequireAuth isAuthenticated={isAuthenticated}><UploadDocument /></RequireAuth>} />
        <Route path="/document/:id" element={<RequireAuth isAuthenticated={isAuthenticated}><DocumentDetails /></RequireAuth>} />
        <Route path="/history" element={<RequireAuth isAuthenticated={isAuthenticated}><VerificationHistory /></RequireAuth>} />
        <Route path="/users" element={<RequireAdmin isAdmin={isAdmin}><UserManagement /></RequireAdmin>} />
        <Route path="/documents" element={
          isAdmin
            ? <RequireAdmin isAdmin={isAdmin}><DocumentManagement /></RequireAdmin>
            : <RequireAuth isAuthenticated={isAuthenticated}><DocumentListPage /></RequireAuth>
        } />
        <Route path="/issuers" element={<RequireAdmin isAdmin={isAdmin}><IssuerManagement /></RequireAdmin>} />
        <Route path="/references" element={<RequireAdmin isAdmin={isAdmin}><TrustedReferenceManagement /></RequireAdmin>} />
        <Route path="/audit" element={<RequireAdmin isAdmin={isAdmin}><AuditLogs /></RequireAdmin>} />
        <Route path="/security" element={<RequireAuth isAuthenticated={isAuthenticated}><SecurityCenter /></RequireAuth>} />
        <Route path="*" element={
          <Navigate to={isAuthenticated ? (isAdmin ? '/admin/dashboard' : '/dashboard') : '/login'} replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;