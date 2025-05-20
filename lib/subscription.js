// lib/subscription.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Checks if a user can perform a search based on their subscription
 * @param {string} userId - The user's ID
 * @returns {Promise<{canSearch: boolean, reason: string|null, searchesRemaining: number|null}>}
 */
export async function checkUserCanSearch(userId) {
  try {
    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return { 
        canSearch: false, 
        reason: 'User not found',
        searchesRemaining: null
      };
    }

    // Check if user has a subscription
    if (!user.subscription) {
      // Create a default free subscription
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'free',
          status: 'inactive',
          searchCount: 0
        },
      });
      
      return { 
        canSearch: true, 
        reason: null,
        searchesRemaining: 5 
      };
    }

    // If user has premium plan with active status, allow unlimited searches
    if (user.subscription.plan === 'premium' && user.subscription.status === 'active') {
      return { 
        canSearch: true, 
        reason: null,
        searchesRemaining: null // Unlimited
      };
    }

    // For free plan, check if they've reached the limit
    const searchCount = user.subscription.searchCount || 0;
    const FREE_TIER_LIMIT = 5;

    if (searchCount >= FREE_TIER_LIMIT) {
      return { 
        canSearch: false, 
        reason: 'You have reached your monthly search limit. Please upgrade to continue searching.',
        searchesRemaining: 0
      };
    }

    // They can search and have searches remaining
    return { 
      canSearch: true, 
      reason: null,
      searchesRemaining: FREE_TIER_LIMIT - searchCount
    };
  } catch (error) {
    console.error('Error checking search permission:', error);
    return { 
      canSearch: false, 
      reason: 'An error occurred while checking search permission',
      searchesRemaining: null
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Increments a user's search count
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} - Whether the increment was successful
 */
export async function incrementSearchCount(userId) {
  try {
    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return false;
    }

    // If no subscription exists, create one
    if (!user.subscription) {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'free',
          status: 'inactive',
          searchCount: 1
        },
      });
      return true;
    }

    // Update search count
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { 
        searchCount: (user.subscription.searchCount || 0) + 1 
      },
    });

    return true;
  } catch (error) {
    console.error('Error incrementing search count:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Reset search counts for all users on the first day of each month
 * This function should be called by a cron job or scheduled task
 */
export async function resetMonthlyCounts() {
  try {
    // Reset all search counts to 0
    await prisma.subscription.updateMany({
      data: { searchCount: 0 },
    });
    
    console.log('Reset all user search counts successfully');
    return true;
  } catch (error) {
    console.error('Error resetting search counts:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}
