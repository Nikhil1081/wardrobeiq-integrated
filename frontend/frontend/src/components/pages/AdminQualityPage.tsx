import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useWardrobe } from '../../store/WardrobeContext';
import {
  ShieldCheck,
  Wrench,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Users,
  Sparkles,
  Search,
} from 'lucide-react';

export const AdminQualityPage: React.FC = () => {
  const { showToast } = useWardrobe();

  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [repairing, setRepairing] = useState<boolean>(false);

  // Image Validator
  const [validateUrl, setValidateUrl] = useState<string>('');
  const [validating, setValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const fetchAudit = async () => {
    try {
      setLoading(true);
      const res = await apiClient.admin.getAudit();
      setAudit(res);
    } catch (err: any) {
      showToast('Error', err?.message || 'Could not load dataset audit', 'rose');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  const handleRepair = async () => {
    try {
      setRepairing(true);
      const res = await apiClient.admin.repairDataset();
      setAudit(res);
      showToast('Dataset Repaired!', 'All clothing images deduplicated and metadata synchronized', 'success');
    } catch (err: any) {
      showToast('Repair Failed', err?.message || 'Could not repair dataset', 'rose');
    } finally {
      setRepairing(false);
    }
  };

  const handleValidateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrl) return;
    try {
      setValidating(true);
      setValidationResult(null);
      const res = await apiClient.admin.validateImage(validateUrl);
      setValidationResult(res);
    } catch (err: any) {
      setValidationResult({ valid: false, reason: err?.message || 'Network unreachable' });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-elevated border border-white/10 relative overflow-hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-luxury-rose mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-3xl font-editorial font-bold text-gray-900 dark:text-white">
            Dataset Quality & Image Governance
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Real-time catalog integrity monitor, duplicate image scanner, and 1-click dataset repair engine.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAudit}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white/10 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit</span>
          </button>
          <button
            onClick={handleRepair}
            disabled={repairing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-luxury-rose to-luxury-lavender text-white font-semibold text-sm shadow-glow-rose hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            <Wrench className={`w-4 h-4 ${repairing ? 'animate-spin' : ''}`} />
            <span>{repairing ? 'Repairing Catalog...' : '1-Click Repair Dataset'}</span>
          </button>
        </div>
      </div>

      {loading && !audit ? (
        <div className="py-24 text-center">
          <RefreshCw className="w-8 h-8 text-luxury-rose animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Auditing catalog SHA-256 hashes and metadata...</p>
        </div>
      ) : (
        audit && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Quality Score Card */}
              <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Catalog Quality Score
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-editorial font-bold text-gray-900 dark:text-white">
                      {audit.imageQualityScore}%
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        audit.imageQualityScore >= 95
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {audit.status}
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              {/* Total Products & Unique Images */}
              <div className="p-5 rounded-2xl glass-panel flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Products / Unique Images
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-editorial font-bold text-gray-900 dark:text-white">
                      {audit.totalProducts}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({audit.uniqueProductImages} Unique)
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Duplicate groups: {audit.duplicateProductImageGroups}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-luxury-rose/15 text-luxury-rose flex items-center justify-center">
                  <ImageIcon className="w-6 h-6" />
                </div>
              </div>

              {/* Wardrobe Items & Unique Images */}
              <div className="p-5 rounded-2xl glass-panel flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Wardrobe Pieces / Images
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-editorial font-bold text-gray-900 dark:text-white">
                      {audit.totalWardrobeItems}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({audit.uniqueWardrobeImages} Unique)
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Duplicate groups: {audit.duplicateWardrobeImageGroups}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
              </div>

              {/* Global Users & Traditional Wear */}
              <div className="p-5 rounded-2xl glass-panel flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                    Global Personas & Traditional
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-editorial font-bold text-gray-900 dark:text-white">
                      {audit.totalUsers} Users
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-400 font-medium mt-1 block">
                    {audit.traditionalItemsCount} Traditional garments
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Category Distribution Grid */}
            <div className="p-6 rounded-2xl glass-panel space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Catalog Category Distribution
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {audit.categoryCounts &&
                  Object.entries(audit.categoryCounts).map(([cat, count]: [string, any]) => (
                    <div
                      key={cat}
                      className="p-3 rounded-xl bg-white/5 border border-white/5 text-center"
                    >
                      <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block capitalize">
                        {cat}
                      </span>
                      <span className="text-xl font-editorial font-bold text-gray-900 dark:text-white mt-0.5 block">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Live Image URL Inspector & Validator */}
            <div className="p-6 rounded-2xl glass-panel-elevated space-y-4">
              <div className="flex items-center gap-2 text-luxury-rose">
                <Search className="w-5 h-5" />
                <h3 className="font-editorial text-lg font-bold text-gray-900 dark:text-white">
                  Real-time Image URL Validator & Scanner
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Test any image URL directly against HTTP HEAD headers, content-type verification, and availability.
              </p>

              <form onSubmit={handleValidateImage} className="flex gap-3">
                <input
                  type="url"
                  required
                  placeholder="Paste any fashion image URL (e.g. https://images.unsplash.com/...)"
                  value={validateUrl}
                  onChange={(e) => setValidateUrl(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 focus:outline-none focus:border-luxury-rose text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={validating}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
                >
                  {validating ? 'Verifying...' : 'Validate URL'}
                </button>
              </form>

              {validationResult && (
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                    validationResult.valid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {validationResult.valid ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span>
                      {validationResult.valid
                        ? `Valid image! Content-Type: ${validationResult.format}`
                        : `Validation failed: ${validationResult.reason}`}
                    </span>
                  </div>
                  {validationResult.valid && (
                    <img
                      src={validateUrl}
                      alt="preview"
                      className="w-8 h-8 rounded object-cover border border-white/20"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
};
