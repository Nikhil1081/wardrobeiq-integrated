import React, { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { useWardrobe } from '../../store/WardrobeContext';
import { X, User, LogIn, UserPlus, Shield, Globe, Sparkles, Check } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    login,
    register,
    loginAsDemoPersona,
    demoPersonas,
    loadingPersonas,
    isAdmin,
  } = useAuth();
  const { setCurrentCustomerId, showToast } = useWardrobe();

  const [activeTab, setActiveTab] = useState<'personas' | 'login' | 'register'>('login');
  const [searchTerm, setSearchTerm] = useState('');

  // Sign In Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCountry, setRegCountry] = useState('India');
  const [regCity, setRegCity] = useState('Mumbai');
  const [regStyle, setRegStyle] = useState('smart-casual');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  if (!isAuthModalOpen) return null;

  const handlePersonaSelect = async (persona: any) => {
    try {
      await loginAsDemoPersona(persona);
      setCurrentCustomerId(persona.userId);
      showToast(`Logged in as ${persona.name}`, `Welcome back! Location: ${persona.country}`, 'success');
      closeAuthModal();
    } catch (err: any) {
      showToast('Login error', err?.message || 'Could not switch persona', 'rose');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      showToast('Welcome back!', 'Successfully signed in', 'success');
      closeAuthModal();
    } catch (err: any) {
      setLoginError(err?.message || 'Invalid email or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        country: regCountry,
        city: regCity,
        preferredStyles: [regStyle],
      });
      showToast('Account Created!', `Welcome to WardrobeIQ, ${regName}`, 'success');
      closeAuthModal();
    } catch (err: any) {
      setRegError(err?.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  const filteredPersonas = demoPersonas.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.country || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl glass-panel-elevated shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 dark:border-white/10 light:border-black/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-luxury-rose to-luxury-lavender flex items-center justify-center text-white shadow-glow-rose">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-editorial font-bold text-gray-900 dark:text-white">
                WardrobeIQ Account & Authentication
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sign in to your personalized AI wardrobe or register a new account
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/5 dark:border-white/5 light:border-black/5">
          {isAdmin && (
            <button
              onClick={() => setActiveTab('personas')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-all ${
                activeTab === 'personas'
                  ? 'border-b-2 border-luxury-rose text-luxury-rose bg-luxury-rose/10'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Admin Personas (105)</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('login')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-all ${
              activeTab === 'login'
                ? 'border-b-2 border-luxury-rose text-luxury-rose bg-luxury-rose/10'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-all ${
              activeTab === 'register'
                ? 'border-b-2 border-luxury-rose text-luxury-rose bg-luxury-rose/10'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab 1: Demo Personas */}
          {isAdmin && activeTab === 'personas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  placeholder="Filter personas by name, country (India, Japan, UK...), or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl text-sm bg-white/5 border border-white/10 dark:border-white/10 light:border-black/10 focus:outline-none focus:border-luxury-rose"
                />
              </div>

              {loadingPersonas ? (
                <div className="py-12 text-center text-sm text-gray-400 animate-pulse">
                  Loading global demo directory...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                  {filteredPersonas.map((persona) => (
                    <button
                      key={persona.userId}
                      onClick={() => handlePersonaSelect(persona)}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/5 dark:border-white/5 light:border-black/5 bg-white/5 hover:bg-white/10 hover:border-luxury-rose/50 transition-all text-left group"
                    >
                      <img
                        src={persona.avatar}
                        alt={persona.name}
                        className="w-12 h-12 rounded-full object-cover border border-white/20"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {persona.name}
                          </span>
                          {persona.role === 'admin' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 flex items-center gap-0.5">
                              <Shield className="w-2.5 h-2.5" /> Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-luxury-rose" /> {persona.country}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate mt-0.5">
                          {(persona.styles || []).join(', ')}
                        </p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-luxury-rose/10 text-luxury-rose font-medium group-hover:bg-luxury-rose group-hover:text-white transition-colors">
                        Select
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Sign In */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 max-w-md mx-auto py-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                  {loginError}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. aarav.sharma@wardrobeiq.demo or admin@wardrobeiq.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-luxury-rose"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-luxury-rose"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Tip: Demo accounts password is <code className="text-luxury-rose">password123</code> (or <code className="text-luxury-rose">admin123</code> for admin).
                </p>
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-luxury-rose to-luxury-lavender text-white shadow-glow-rose hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {loginLoading ? 'Signing In...' : 'Sign In to WardrobeIQ'}
              </button>
            </form>
          )}

          {/* Tab 3: Create Account */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 max-w-md mx-auto py-2">
              {regError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                  {regError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Priya Kapoor"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-luxury-rose"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="priya@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-luxury-rose"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-luxury-rose"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    placeholder="India"
                    value={regCountry}
                    onChange={(e) => setRegCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-luxury-rose"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Mumbai"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-luxury-rose"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Primary Style Preference
                </label>
                <select
                  value={regStyle}
                  onChange={(e) => setRegStyle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-luxury-rose text-gray-900 dark:text-white"
                >
                  <option value="smart-casual" className="bg-dark-900 text-white">Smart Casual</option>
                  <option value="minimalist" className="bg-dark-900 text-white">Minimalist</option>
                  <option value="streetwear" className="bg-dark-900 text-white">Streetwear</option>
                  <option value="ethnic" className="bg-dark-900 text-white">Ethnic / Traditional</option>
                  <option value="formal" className="bg-dark-900 text-white">Formal & Tailored</option>
                  <option value="chic" className="bg-dark-900 text-white">Luxury Chic</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full py-3 mt-2 rounded-xl font-semibold text-sm bg-gradient-to-r from-luxury-rose to-luxury-lavender text-white shadow-glow-rose hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {regLoading ? 'Creating Account...' : 'Complete Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
