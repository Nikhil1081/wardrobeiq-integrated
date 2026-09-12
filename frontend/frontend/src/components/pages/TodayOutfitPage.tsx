import React, { useState, useEffect } from 'react';
import { useWardrobe } from '../../store/WardrobeContext';
import { apiClient } from '../../api/client';
import { ClothingImage } from '../common/ClothingImage';
import {
  CloudSun,
  CloudRain,
  Thermometer,
  Wind,
  Droplets,
  Sparkles,
  RefreshCw,
  Bookmark,
  AlertTriangle,
  Compass,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const TodayOutfitPage: React.FC = () => {
  const { currentCustomerId, currentCustomer, saveOutfitToDB, showToast } = useWardrobe();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<string>(currentCustomer?.city || 'Mumbai');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('casual');
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const fetchTodayOutfit = async (presetOverride?: string) => {
    try {
      setLoading(true);
      const res = await apiClient.getTodayOutfit({
        customerId: currentCustomerId,
        city: selectedCity,
        occasion: selectedOccasion,
        preset: presetOverride !== undefined ? presetOverride : selectedPreset || undefined,
      });
      setData(res);
    } catch (err: any) {
      showToast('Could not fetch weather outfit', err?.message || 'Please try again', 'rose');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayOutfit();
  }, [currentCustomerId, selectedOccasion]);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
    setSelectedPreset('');
    setTimeout(() => fetchTodayOutfit(''), 100);
  };

  const handlePresetSelect = (presetKey: string) => {
    setSelectedPreset(presetKey);
    fetchTodayOutfit(presetKey);
  };

  const handleSaveOutfit = async () => {
    if (!data?.outfit) return;
    const items = Object.values(data.outfit).filter(Boolean);
    if (items.length === 0) return;

    try {
      await saveOutfitToDB({
        outfitId: `outfit_today_${Date.now()}`,
        name: `Today's ${data.weather.condition} Outfit (${selectedOccasion})`,
        occasion: selectedOccasion as any,
        season: 'all-season',
        totalCost: items.reduce((acc: number, item: any) => acc + (item.price || 0), 0),
        items: items as any[],
        rationale: data.stylingRationale,
        createdAt: new Date().toISOString(),
      });
      showToast('Outfit Saved!', "Saved to your 'Saved Outfits' gallery", 'success');
    } catch (err: any) {
      showToast('Error', err?.message || 'Could not save outfit', 'rose');
    }
  };

  const weather = data?.weather;
  const outfit = data?.outfit;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass-panel-elevated border border-white/10 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-luxury-rose mb-1">
            <CloudSun className="w-4 h-4" />
            <span>Atmospheric Personal Stylist</span>
          </div>
          <h1 className="text-3xl font-editorial font-bold text-gray-900 dark:text-white">
            What Should I Wear Today?
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Real-time weather telemetry combined with your owned wardrobe items to curate the perfect climate-proof ensemble.
          </p>
        </div>

        {/* Global Location & Simulation Controls */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <Compass className="w-4 h-4 text-luxury-rose" />
            <select
              value={selectedCity}
              onChange={handleCityChange}
              className="bg-transparent text-sm font-medium text-gray-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="Mumbai" className="bg-dark-900 text-white">Mumbai, India</option>
              <option value="Delhi" className="bg-dark-900 text-white">New Delhi, India</option>
              <option value="Bengaluru" className="bg-dark-900 text-white">Bengaluru, India</option>
              <option value="London" className="bg-dark-900 text-white">London, UK</option>
              <option value="New York" className="bg-dark-900 text-white">New York, USA</option>
              <option value="Tokyo" className="bg-dark-900 text-white">Tokyo, Japan</option>
              <option value="Paris" className="bg-dark-900 text-white">Paris, France</option>
              <option value="Dubai" className="bg-dark-900 text-white">Dubai, UAE</option>
              <option value="Seoul" className="bg-dark-900 text-white">Seoul, South Korea</option>
              <option value="Sydney" className="bg-dark-900 text-white">Sydney, Australia</option>
            </select>
          </div>

          <button
            onClick={() => fetchTodayOutfit()}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-luxury-rose/15 text-luxury-rose hover:bg-luxury-rose/25 text-sm font-semibold transition-all border border-luxury-rose/30"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {/* Weather Telemetry & Quick Simulation Strip */}
      {weather && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Main Temp Card */}
          <div className="md:col-span-2 p-5 rounded-2xl glass-panel flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-4xl font-editorial font-bold text-gray-900 dark:text-white">
                  {weather.temperature}°C
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-white/10 text-gray-400">
                  Feels like {weather.apparentTemperature}°C
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                {weather.isRainy ? (
                  <CloudRain className="w-4 h-4 text-blue-400" />
                ) : (
                  <CloudSun className="w-4 h-4 text-amber-400" />
                )}
                <span>{weather.condition} in {weather.city}, {weather.country}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {weather.summary}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span>{weather.humidity}% Humidity</span>
              </div>
              {weather.precipitation > 0 && (
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  <CloudRain className="w-3.5 h-3.5" />
                  <span>{weather.precipitation} mm Rain</span>
                </div>
              )}
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                weather.thermalBand === 'freezing'
                  ? 'bg-blue-500/20 text-blue-300'
                  : weather.thermalBand === 'cool'
                  ? 'bg-teal-500/20 text-teal-300'
                  : weather.thermalBand === 'warm'
                  ? 'bg-amber-500/20 text-amber-300'
                  : weather.thermalBand === 'hot'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                Thermal Band: {weather.thermalBand}
              </span>
            </div>
          </div>

          {/* Quick Climate Simulation Presets */}
          <div className="md:col-span-2 p-5 rounded-2xl glass-panel flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Instant Climate Test Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handlePresetSelect('hot_summer')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedPreset === 'hot_summer'
                    ? 'border-rose-500 bg-rose-500/20 text-white'
                    : 'border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                }`}
              >
                ☀️ 34°C Heatwave
              </button>
              <button
                onClick={() => handlePresetSelect('monsoon_rain')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedPreset === 'monsoon_rain'
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                }`}
              >
                🌧️ Monsoon Rain
              </button>
              <button
                onClick={() => handlePresetSelect('freezing_winter')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedPreset === 'freezing_winter'
                    ? 'border-cyan-500 bg-cyan-500/20 text-white'
                    : 'border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                }`}
              >
                ❄️ 2°C Freezing
              </button>
              <button
                onClick={() => handlePresetSelect('crisp_autumn')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedPreset === 'crisp_autumn'
                    ? 'border-amber-500 bg-amber-500/20 text-white'
                    : 'border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                }`}
              >
                🍂 14°C Autumn
              </button>
              <button
                onClick={() => handlePresetSelect('mild_spring')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedPreset === 'mild_spring'
                    ? 'border-emerald-500 bg-emerald-500/20 text-white'
                    : 'border-white/10 hover:border-white/20 text-gray-400 hover:text-white'
                }`}
              >
                🌸 21°C Mild
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Occasion Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2 whitespace-nowrap">
          Target Occasion:
        </span>
        {['casual', 'workwear', 'dateNight', 'college', 'festival', 'wedding', 'travel'].map((occ) => (
          <button
            key={occ}
            onClick={() => setSelectedOccasion(occ)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap ${
              selectedOccasion === occ
                ? 'bg-luxury-rose text-white shadow-glow-rose'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            {occ === 'dateNight' ? 'Date Night' : occ}
          </button>
        ))}
      </div>

      {/* Missing Layer Gap Alert (Weather Protection) */}
      {data?.missingLayerGap && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-300">
                Identified Wardrobe Gap: {data.missingLayerGap.description}
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">
                Your wardrobe does not contain an optimal outer layer for {weather.temperature}°C {weather.condition.toLowerCase()} conditions. We recommend acquiring this piece to complete your protection.
              </p>
            </div>
          </div>

          {data.missingLayerGap.recommendedProduct && (
            <div className="flex items-center gap-3 bg-black/30 p-2.5 rounded-xl border border-white/10 shrink-0">
              <img
                src={data.missingLayerGap.recommendedProduct.imageUrl}
                alt={data.missingLayerGap.recommendedProduct.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <p className="text-xs font-semibold text-white line-clamp-1">
                  {data.missingLayerGap.recommendedProduct.name}
                </p>
                <p className="text-[11px] text-luxury-rose font-bold">
                  ₹{data.missingLayerGap.recommendedProduct.price} • {data.missingLayerGap.recommendedProduct.store}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* The Curated Outfit Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-luxury-rose animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">Assembling weather-optimized outfit from your closet...</p>
        </div>
      ) : outfit && Object.keys(outfit).length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {outfit.traditional && (
              <div className="p-4 rounded-2xl glass-panel space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Cultural / Traditional Layer
                </span>
                <ClothingImage
                  src={outfit.traditional.imageUrl}
                  backupSrc={outfit.traditional.backupImageUrl}
                  alt={outfit.traditional.name}
                  category={outfit.traditional.category}
                  color={outfit.traditional.color}
                  isTraditional={true}
                  culturalOrigin={outfit.traditional.culturalOrigin}
                  className="w-full"
                />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {outfit.traditional.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {outfit.traditional.color} • {outfit.traditional.subcategory}
                  </p>
                </div>
              </div>
            )}

            {outfit.top && (
              <div className="p-4 rounded-2xl glass-panel space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-luxury-rose">
                  Base / Top Layer
                </span>
                <ClothingImage
                  src={outfit.top.imageUrl}
                  backupSrc={outfit.top.backupImageUrl}
                  alt={outfit.top.name}
                  category={outfit.top.category}
                  color={outfit.top.color}
                  className="w-full"
                />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {outfit.top.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {outfit.top.color} • {outfit.top.subcategory}
                  </p>
                </div>
              </div>
            )}

            {outfit.bottom && (
              <div className="p-4 rounded-2xl glass-panel space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  Bottom Layer
                </span>
                <ClothingImage
                  src={outfit.bottom.imageUrl}
                  backupSrc={outfit.bottom.backupImageUrl}
                  alt={outfit.bottom.name}
                  category={outfit.bottom.category}
                  color={outfit.bottom.color}
                  className="w-full"
                />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {outfit.bottom.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {outfit.bottom.color} • {outfit.bottom.subcategory}
                  </p>
                </div>
              </div>
            )}

            {outfit.outerwear && (
              <div className="p-4 rounded-2xl glass-panel space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Weather Outerwear
                </span>
                <ClothingImage
                  src={outfit.outerwear.imageUrl}
                  backupSrc={outfit.outerwear.backupImageUrl}
                  alt={outfit.outerwear.name}
                  category={outfit.outerwear.category}
                  color={outfit.outerwear.color}
                  className="w-full"
                />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {outfit.outerwear.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {outfit.outerwear.color} • {outfit.outerwear.subcategory}
                  </p>
                </div>
              </div>
            )}

            {outfit.footwear && (
              <div className="p-4 rounded-2xl glass-panel space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                  Footwear
                </span>
                <ClothingImage
                  src={outfit.footwear.imageUrl}
                  backupSrc={outfit.footwear.backupImageUrl}
                  alt={outfit.footwear.name}
                  category={outfit.footwear.category}
                  color={outfit.footwear.color}
                  className="w-full"
                />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {outfit.footwear.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {outfit.footwear.color} • {outfit.footwear.subcategory}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* AI Styling Rationale & Action Bar */}
          <div className="p-6 rounded-2xl glass-panel-elevated space-y-4">
            <div className="flex items-center gap-2 text-luxury-rose">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-editorial text-lg font-bold text-gray-900 dark:text-white">
                Personalized Styling Rationale
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {data.stylingRationale}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 dark:border-white/10 light:border-black/10">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Color Harmony:</span>
                <div className="flex items-center gap-1.5">
                  {data.paletteHarmony?.map((col: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-white/10 text-gray-300"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveOutfit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-gray-900 dark:text-white transition-all border border-white/15"
                >
                  <Bookmark className="w-4 h-4 text-luxury-rose" />
                  <span>Save to Outfits</span>
                </button>
                <button
                  onClick={() => {
                    showToast('Logged as Worn!', 'Updated wear date for these items', 'success');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-luxury-rose to-luxury-lavender text-white shadow-glow-rose hover:opacity-95 transition-opacity"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Wear This Today</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center glass-panel rounded-2xl">
          <p className="text-sm text-gray-400">No matching wardrobe items found for this customer.</p>
        </div>
      )}
    </div>
  );
};
