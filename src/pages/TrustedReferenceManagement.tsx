import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useAuth } from '../services/authService';

interface TrustedReference {
  id: string;
  name: string;
  filename: string;
  sha256_hash: string;
  is_active: boolean | number;
  is_validated: boolean | number;
  is_demo: boolean | number;
  registered_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

const TrustedReferenceManagement: React.FC = () => {
  const { user, loading, csrfCheckedRequest, csrfProtectedRequest } = useAuth();
  const [references, setReferences] = useState<TrustedReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingReferenceId, setUpdatingReferenceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchReferences = useCallback(async () => {
    const response = await csrfCheckedRequest('/references/list.php?active=0', 'GET');
    const result = await response.json() as ApiResponse<TrustedReference[]>;
    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.error || 'Unable to load trusted references.');
    }
    return result.data;
  }, [csrfCheckedRequest]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchReferences();
        if (!cancelled) {
          setReferences(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load trusted references.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user, fetchReferences]);

  const loadReferences = async () => {
    setReferences(await fetchReferences());
  };

  const handleToggle = async (reference: TrustedReference) => {
    const shouldActivate = !(reference.is_active === true || reference.is_active === 1);
    setUpdatingReferenceId(reference.id);
    setError(null);
    setNotice(null);

    try {
      const body = new URLSearchParams({
        reference_id: reference.id,
        is_active: shouldActivate ? 'true' : 'false',
      });
      const response = await csrfProtectedRequest('/references/activate.php', 'POST', body, {
        'Content-Type': 'application/x-www-form-urlencoded',
      });
      const result = await response.json() as ApiResponse<{ is_active: boolean; changed: boolean }>;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Unable to update trusted reference.');
      }

      setNotice(
        result.data.changed
          ? `Reference ${reference.id} ${result.data.is_active ? 'activated' : 'deactivated'}.`
          : `Reference ${reference.id} was already ${result.data.is_active ? 'active' : 'inactive'}.`
      );
      await loadReferences();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update trusted reference.');
    } finally {
      setUpdatingReferenceId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Checking administrator session...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">
          Administrator access is required to manage trusted references.
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar activeItem="references" />
      <div className="app-main">
        <TopNav title="Trusted References" />
        <main className="app-content">
          <div className="app-content-inner space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Trusted Reference Management</h1>
              <p className="mt-2 text-gray-600">
                Activate or deactivate validated reference files used for document hash checks.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Fictional demo references and matching uploads are test data, not evidence of real property ownership.
              </p>
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            {notice && (
              <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {notice}
              </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reference</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">File</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">SHA-256</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">State</th>
                      <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading trusted references...
                          </span>
                        </td>
                      </tr>
                    ) : references.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-500">
                          No registered trusted references are available.
                        </td>
                      </tr>
                    ) : references.map((reference) => {
                      const active = reference.is_active === true || reference.is_active === 1;
                      const validated = reference.is_validated === true || reference.is_validated === 1;
                      const demo = reference.is_demo === true || reference.is_demo === 1;
                      return (
                        <tr key={reference.id}>
                          <td className="px-5 py-4 text-sm">
                            <div className="font-medium text-gray-900">{reference.id}</div>
                            <div className="text-gray-500">{reference.name}</div>
                            {demo && (
                              <div className="mt-1 text-xs text-amber-700">Fictional demo reference</div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700">{reference.filename}</td>
                          <td className="px-5 py-4 font-mono text-xs text-gray-600 break-all">{reference.sha256_hash}</td>
                          <td className="px-5 py-4 text-sm">
                            <div className="flex flex-col items-start gap-2">
                              <StatusBadge status={active ? 'ACTIVE' : 'INACTIVE'} />
                              <StatusBadge status={validated ? 'VALIDATED' : 'UNVALIDATED'} />
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Button
                              variant={active ? 'danger' : 'primary'}
                              size="sm"
                              disabled={!validated || updatingReferenceId !== null}
                              onClick={() => void handleToggle(reference)}
                            >
                              {updatingReferenceId === reference.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : active ? 'Deactivate' : 'Activate'}
                            </Button>
                            {!validated && (
                              <p className="mt-2 text-xs text-gray-500">Unvalidated references cannot be activated.</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-4 w-4" />
              Activation is revalidated against the protected server-side reference file and requires an administrator session and CSRF token.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TrustedReferenceManagement;
