import { getCustomerProfile, toCustomerDTO } from '../tools/customerTools.js';
import { getWardrobeItems, analyzeWardrobe, calculateWardrobeHealth } from '../tools/wardrobeTools.js';
import { detectGaps } from '../tools/gapTools.js';
import { getCustomerBrowsingSignals } from '../tools/browsingTools.js';
import { getPersonalizedRecommendationsService } from './recommendation.service.js';
import { getSavedItemsService } from './saved.service.js';
import { DashboardDTO, ActivityDTO } from '../types/dto.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getHomeDashboardService(customerId: string): Promise<DashboardDTO> {
  const customer = await getCustomerProfile(customerId);
  if (!customer) {
    throw new AppError(404, 'CUSTOMER_NOT_FOUND', `Customer with ID ${customerId} not found.`);
  }

  const wardrobe = await getWardrobeItems(customerId);
  const analysis = analyzeWardrobe(wardrobe, customer);
  const health = calculateWardrobeHealth(analysis, customer);
  const browsingSignals = await getCustomerBrowsingSignals(customerId);
  const allGaps = detectGaps(analysis, customer, wardrobe, browsingSignals.summary);

  const topGaps = allGaps.slice(0, 3);
  const priorityGaps = allGaps.filter((g) => g.priority === 'very_high' || g.priority === 'high');

  // Unified personalized recommendations & outfits
  const recData = await getPersonalizedRecommendationsService(customerId);

  // Saved items count
  const savedData = await getSavedItemsService(customerId);

  // Time-based greeting
  const hour = new Date().getHours();
  let greetingTime = 'Hello';
  if (hour < 12) greetingTime = 'Good morning';
  else if (hour < 17) greetingTime = 'Good afternoon';
  else greetingTime = 'Good evening';

  const greeting = `${greetingTime}, ${customer.name.split(' ')[0]}!`;

  // Synthetic activity feed based on actual customer state
  const recentActivity: ActivityDTO[] = [];
  if (allGaps.length > 0) {
    recentActivity.push({
      id: 'act_1',
      type: 'gap_detected',
      title: `High Priority Gap: ${allGaps[0].label}`,
      timestamp: new Date().toISOString(),
    });
  }
  if (wardrobe.length > 0) {
    recentActivity.push({
      id: 'act_2',
      type: 'closet_add',
      title: `Added "${wardrobe[0].name}" to your closet`,
      timestamp: wardrobe[0].createdAt || new Date().toISOString(),
    });
  }
  if (recData.activeOffers.length > 0) {
    recentActivity.push({
      id: 'act_3',
      type: 'offer_applied',
      title: `Special Promotion: ${recData.activeOffers[0].label}`,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    customer: toCustomerDTO(customer),
    greeting,
    profileSummary: {
      budgetLabel: `₹${customer.budget} Max`,
      dominantStyle: analysis.dominantStyles[0] || customer.preferredStyles[0] || 'Casual',
      activeSeason: customer.currentSeason.toUpperCase(),
    },
    wardrobeStatistics: {
      totalItems: analysis.totalItems,
      categoryCounts: analysis.categoryCounts,
      dominantColors: analysis.dominantColors,
      dominantStyles: analysis.dominantStyles,
      occasionCoverage: analysis.occasionCoverage,
      colorDiversity: analysis.colorDiversity,
      topCategory: analysis.topCategory,
      weakestCategory: analysis.weakestCategory,
      browsingSignals: {
        totalEvents: browsingSignals.productWeights.size,
      },
    },
    wardrobeHealth: health,
    topWardrobeGaps: topGaps,
    priorityGaps,
    recommendedProducts: recData.recommendations.slice(0, 6),
    recommendedOutfits: recData.outfits,
    recentActivity,
    savedCount: savedData.savedProducts.length,
    outfitCount: savedData.savedOutfits.length,
  };
}
