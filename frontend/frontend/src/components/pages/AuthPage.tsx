import React, { useState } from 'react';
import { useAuth, DemoPersona } from '../../store/AuthContext';
import { useWardrobe } from '../../store/WardrobeContext';
import {
  Lock,
  Mail,
  User,
  Globe,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  LogOut,
  MapPin,
  LogIn,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isAdmin,
    login,
    register,
    loginAsDemoPersona,
    logout,
    demoPersonas,
    loadingPersonas,
  } = useAuth();
  const { setActiveTab, showToast, setCurrentCustomerId } = useWardrobe();

  const [activeSubTab, setActiveSubTab] = useState<'login' | 'register' | 'personas'>(
    isAuthenticated && isAdmin ? 'personas' : 'login'
  );

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCountry, setRegCountry] = useState('India');
  const [regCity, setRegCity] = useState('Mumbai');
  const [regStyles, setRegStyles] = useState<string[]>(['streetwear', 'casual']);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Persona Search
  const [searchQuery, setSearchQuery] = useState('');

  const styleOptions = [
    'casual',
    'streetwear',
    'minimalist',
    'formal',
    'smart-casual',
    'ethnic fusion',
    'traditional',
    'classic',
    'preppy',
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      showToast('Welcome back!', 'You have successfully signed in.', 'success');
      setActiveTab('home');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please verify credentials.');
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
        preferredStyles: regStyles,
      });
      showToast('Account created!', 'Your personalized wardrobe is ready.', 'success');
      setActiveTab('home');
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  const handlePersonaLogin = async (persona: DemoPersona) => {
    await loginAsDemoPersona(persona);
    if (persona.userId.startsWith('C') || persona.userId.startsWith('c')) {
      setCurrentCustomerId(persona.userId);
    }
    showToast(`Logged in as ${persona.name}`, `Loaded custom wardrobe & preferences for ${persona.country}.`, 'rose');
    setActiveTab('home');
  };

  const toggleStyle = (style: string) => {
    setRegStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const filteredPersonas = demoPersonas.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.country || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.styles || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 p-8 md:p-10 shadow-glass">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-luxury-rose/20 text-luxury-rose border border-luxury-rose/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>WardrobeIQ Identity &amp; Access</span>
            </div>
            <h1 className="font-editorial text-3xl md:text-5xl font-bold text-gray-900 dark:text-luxury-cream">
              {isAuthenticated ? `Welcome, ${user?.name}` : 'Sign In or Join WardrobeIQ'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
              Access your personalized AI wardrobe advisor, explore custom gaps across 105 global personas, and save outfits tailored to your climate and cultural preferences.
            </p>
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  logout();
                  showToast('Signed Out', 'You have been safely logged out.', 'info');
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold bg-white/10 hover:bg-red-500/20 text-red-400 border border-white/10 hover:border-red-500/30 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Authenticated User Profile Summary Card */}
      {isAuthenticated && user && (
        <div className="glass-panel p-6 rounded-2xl border border-luxury-rose/30 bg-gradient-to-r from-luxury-rose/10 via-transparent to-transparent">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-luxury-rose/40 shadow-glow-rose"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{user.name}</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-luxury-rose/20 text-luxury-rose font-semibold border border-luxury-rose/30">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-luxury-rose" />
                    {user.city || 'Global'}, {user.country || 'World'}
                  </span>
                  <span>�</span>
                  <span className="capitalize text-luxury-peach">
                    {user.preferredStyles?.join(', ') || 'Casual'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('closet')}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-luxury-rose text-dark-950 hover:bg-luxury-blush transition-colors"
              >
                View My Closet &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveSubTab('login')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'login'
              ? 'border-luxury-rose text-luxury-rose font-bold'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setActiveSubTab('register')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'register'
              ? 'border-luxury-rose text-luxury-rose font-bold'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Create Account
        </button>
        {isAdmin && (
        <button
          onClick={() => setActiveSubTab('personas')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'personas'
              ? 'border-luxury-rose text-luxury-rose font-bold'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-luxury-blush" />
          <span>105 Global Personas (Admin Switcher)</span>
        </button>
      )}
      </div>

      {/* TAB 1: SIGN IN */}
      {activeSubTab === 'login' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 glass-panel p-8 rounded-3xl border border-white/10 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sign In to Your Account</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Enter your registered email and password to access your wardrobe.
              </p>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="aarav.sharma@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 focus:border-luxury-rose text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="��������"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 focus:border-luxury-rose text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-luxury-rose to-luxury-blush text-dark-950 hover:opacity-95 transition-all shadow-glow-rose cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loginLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="md:col-span-5 space-y-4">
            <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-luxury-blush">
                <Sparkles className="w-4 h-4" />
                <span>Instant Demo Credentials</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                You can log in directly with any pre-seeded persona:
              </p>
              <div className="space-y-2 font-mono text-xs">
                <div
                  onClick={() => {
                    setLoginEmail('aarav.sharma@example.com');
                    setLoginPassword('password123');
                  }}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-luxury-rose/40 cursor-pointer transition-colors"
                >
                  <div className="text-luxury-cream font-bold">Aarav Sharma (India)</div>
                  <div className="text-gray-400 text-[11px]">aarav.sharma@example.com</div>
                  <div className="text-gray-500 text-[10px]">pass: password123 (Click to fill)</div>
                </div>

                <div
                  onClick={() => {
                    setLoginEmail('admin@wardrobeiq.internal');
                    setLoginPassword('admin123');
                  }}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-luxury-rose/40 cursor-pointer transition-colors"
                >
                  <div className="text-emerald-400 font-bold">Administrator</div>
                  <div className="text-gray-400 text-[11px]">admin@wardrobeiq.internal</div>
                  <div className="text-gray-500 text-[10px]">pass: admin123 (Click to fill)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTER */}
      {activeSubTab === 'register' && (
        <div className="glass-panel p-8 rounded-3xl border border-white/10 max-w-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Your Personal Styling Profile</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Join WardrobeIQ to curate your digital closet and discover personalized gaps.
            </p>
          </div>

          {regError && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{regError}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Priya Patel"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 focus:border-luxury-rose text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="priya@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 focus:border-luxury-rose text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 focus:border-luxury-rose text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Country</label>
                <input
                  type="text"
                  value={regCountry}
                  onChange={(e) => setRegCountry(e.target.value)}
                  placeholder="India, United States, Japan..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 focus:border-luxury-rose text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">City</label>
                <input
                  type="text"
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  placeholder="Mumbai, Tokyo, New York..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 focus:border-luxury-rose text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Style Aesthetics (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {styleOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStyle(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      regStyles.includes(s)
                        ? 'bg-luxury-rose text-dark-950 font-bold'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider bg-gradient-to-r from-luxury-rose to-luxury-blush text-dark-950 hover:opacity-95 transition-all shadow-glow-rose cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              {regLoading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account &amp; Start Styling</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: 105 DEMO PERSONAS DIRECTORY */}
      {isAdmin && activeSubTab === 'personas' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Global Persona Directory ({demoPersonas.length} Available)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click any persona to instantly log in and inspect their custom wardrobe, gaps, and weather recommendations.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, country, style..."
                className="w-full px-4 py-2 rounded-xl text-xs bg-white/5 border border-white/10 focus:border-luxury-rose text-white focus:outline-none"
              />
            </div>
          </div>

          {loadingPersonas ? (
            <div className="text-center py-12 text-sm text-gray-400 animate-pulse">
              Loading 105 personas from database...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPersonas.map((persona) => {
                const isSelected = user?.email === persona.email;
                return (
                  <div
                    key={persona.userId}
                    onClick={() => handlePersonaLogin(persona)}
                    className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-luxury-rose/60 bg-luxury-rose/15 shadow-glow-rose'
                        : 'border-white/10 hover:border-luxury-rose/40 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={persona.avatar}
                        alt={persona.name}
                        className="w-12 h-12 rounded-xl object-cover border border-white/10 group-hover:scale-105 transition-transform shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-luxury-rose transition-colors">
                          {persona.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-luxury-peach" />
                          <span>{persona.country}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 capitalize truncate mt-0.5">
                          {(persona.styles || []).slice(0, 2).join(', ')}
                        </div>
                      </div>
                    </div>

                    <button
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-luxury-rose text-dark-950'
                          : 'bg-white/10 text-gray-300 group-hover:bg-luxury-rose group-hover:text-dark-950'
                      }`}
                    >
                      {isSelected ? 'Active' : '1-Click'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
