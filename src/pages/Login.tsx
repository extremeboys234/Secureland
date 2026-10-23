import React, { useState } from 'react';
import {
  LogIn,
  Shield,
  CheckCircle,
  Lock,
  FileText,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Zap as LightningZap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/authService';

const Login: React.FC = () => {
  const { login, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<'admin' | 'user'>('user');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [showPassword, setShowPassword] = useState(false);

  const selectRole = (role: 'admin' | 'user') => {
    setActiveTab(role);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(formData.email, formData.password, activeTab as 'admin' | 'user');
      window.location.assign(activeTab === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'light' : 'dark');
  };

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 py-8 ${isDarkMode ? 'dark-bg' : 'light-bg'}`}
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <div className="relative w-full max-w-[1400px]">
        {/* Floating decorative elements */}
        <div className="absolute -top-10 -left-10 w-[200px] h-[200px] bg-gradient-to-br from-purple-500/10 to-transparent rounded-full animate-float-slow" aria-hidden="true"></div>
        <div className="absolute bottom-10 right-10 w-[180px] h-[180px] bg-gradient-to-tr from-pink-500/10 to-transparent rounded-full animate-float" aria-hidden="true"></div>
        <div className="absolute top-20 left-[60%] w-[80px] h-[80px] bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full animate-float-delay" aria-hidden="true"></div>

        <div className="relative z-10 grid gap-8 w-full max-w-[1200px] grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Information */}
          <div className="hidden lg:flex flex-col items-center justify-center p-8 text-center">
            <div className="flex items-center space-x-6 mb-8">
              <Shield className="h-14 w-14 text-white/90 drop-shadow-lg" />
              <div>
                <h1 className="text-3xl font-bold text-white/90 mb-2">SecureLand</h1>
                <p className="text-white/80 text-lg">Secure Property Document Verification</p>
              </div>
            </div>

            <p className="max-w-xl text-white/70 leading-relaxed">
              Compare document SHA-256 fingerprints against trusted references and review verification history.
              A hash match confirms byte equality only; it does not establish ownership or legal authenticity.
            </p>

            <div className="mt-10 flex flex-col gap-4 w-full">
              <div className="flex items-center space-x-4 p-5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/15 transition-all">
                <FileText className="h-6 w-6 text-white/90" />
                <div className="flex-1">
                  <h3 className="text-white/90 font-semibold">SHA-256 Document Fingerprinting</h3>
                  <p className="text-white/70 text-sm">Unique cryptographic hash for every document</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/15 transition-all">
                <CheckCircle className="h-6 w-6 text-white/90" />
                <div className="flex-1">
                  <h3 className="text-white/90 font-semibold">Trusted Reference Comparison</h3>
                  <p className="text-white/70 text-sm">Compare a document fingerprint against an active reference</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/15 transition-all">
                <LightningZap className="h-6 w-6 text-white/90 animate-pulse" />
                <div className="flex-1">
                  <h3 className="text-white/90 font-semibold">Protected Server-Side Storage</h3>
                  <p className="text-white/70 text-sm">Document files are stored outside the public web directory</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full lg:w-[480px] bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-10">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
              <Shield className="h-10 w-10 text-white/90 drop-shadow" />
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white/90 mb-1">Welcome to SecureLand</h2>
                <p className="text-white/80 text-sm">Securely access your property documents</p>
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="absolute top-4 right-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun className="h-4 w-4 text-white/90" /> : <Moon className="h-4 w-4 text-white/90" />}
              </button>
            </div>

            <div className="w-full space-y-6">
              {/* Tabs */}
              <div className="flex w-full bg-white/5 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => selectRole('user')}
                  className={`flex-1 px-5 py-3 text-sm font-medium transition-all ${
                    activeTab === 'user'
                      ? 'bg-white/20 text-white/90 border-b-2 border-white/30'
                      : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                  }`}
                >
                  User Login
                </button>
                <button
                  type="button"
                  onClick={() => selectRole('admin')}
                  className={`flex-1 px-5 py-3 text-sm font-medium transition-all ${
                    activeTab === 'admin'
                      ? 'bg-white/20 text-white/90 border-b-2 border-white/30'
                      : 'text-white/60 hover:text-white/80 hover:bg-white/10'
                  }`}
                >
                  Admin Login
                </button>
              </div>

              {/* Form */}
              <form
                method="POST"
                action="/login.php"
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <input type="hidden" name="role" value={activeTab} />
                <div>
                  <label htmlFor="email" className="block mb-2 text-white/80 font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-white/30 text-white/90 placeholder-white/50 outline-none transition-all duration-300"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block mb-2 text-white/80 font-medium">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-4 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-white/30 text-white/90 placeholder-white/50 outline-none transition-all duration-300"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/60 hover:text-white/80 transition-colors"
                      onClick={() => setShowPassword((previous) => !previous)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-3 text-white/70 text-sm">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="h-4 w-4 text-white/90 focus:ring-white/20 border-white/30 rounded"
                    />
                    Remember me
                  </label>
                  <Link to="#" className="text-white/70 hover:text-white/90 text-sm transition-colors">
                    Forgot password?
                  </Link>
                </div>

                <div className="flex items-center space-x-3 text-white/60 text-xs">
                  <Lock className="h-3 w-3" />
                  <span>Session-based sign-in with role-based access checks</span>
                </div>

                {error && (
                  <div className="bg-white/10 border border-white/20 text-white/80 px-5 py-4 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center px-5 py-4 bg-white/20 text-white/90 font-medium rounded-xl hover:bg-white/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-3" />
                      Login as {activeTab === 'admin' ? 'Admin' : 'User'}
                    </>
                  )}
                </button>

                <div className="text-center mt-6">
                  <p className="text-white/60 text-sm">
                    Don't have an account? <Link to="#" className="text-white/90 hover:text-white/100 font-medium">Contact administrator</Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Animated particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(138,43,226,0.15)_0%,transparent_50%)] animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,105,180,0.1)_0%,transparent_50%)] animate-[spin_15s_linear_infinite_reverse]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(30,144,255,0.1)_0%,transparent_50%)] animate-[spin_20s_linear_infinite]" />
        </div>
      </div>
    </div>
  );
};

export default Login;