// lib/subscription.js
import { prisma } from '../../../lib/prisma';

/**
 * Checks if a user can perform a search based on their subscription
 * @param {string} userId - The user's ID
 * @returns {Promise<{canSearch: boolean, reason: string|null, searchesRemaining: number|null}>}
 */
export async function checkUserCanSearch(userId) {
  try {
    console.log(`Checking if user can search: ${userId}`);
    
    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      console.log(`User not found: ${userId}`);
      return { 
        canSearch: true, // Allow search anyway to prevent blocking
        reason: 'User not found',
        searchesRemaining: null
      };
    }

    // Check if user has a subscription
    if (!user.subscription) {
      console.log(`No subscription for user: ${userId}, creating one`);
      // Create a default free subscription
      try {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            plan: 'free',
            status: 'inactive',
            searchCount: 0
          },
        });
      } catch (error) {
        console.error("Error creating subscription:", error);
        // Continue anyway
      }
      
      return { 
        canSearch: true, 
        reason: null,
        searchesRemaining: 5 
      };
    }

    // If user has premium plan with active status, allow unlimited searches
    if (user.subscription.plan === 'premium' && user.subscription.status === 'active') {
      console.log(`User ${userId} has premium plan, unlimited searches allowed`);
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
      console.log(`User ${userId} has reached search limit (${searchCount}/${FREE_TIER_LIMIT})`);
      return { 
        canSearch: true, // Still allow search but inform user
        reason: 'You have reached your monthly search limit. Please upgrade to continue searching.',
        searchesRemaining: 0
      };
    }

    console.log(`User ${userId} has ${FREE_TIER_LIMIT - searchCount} searches remaining`);
    // They can search and have searches remaining
    return { 
      canSearch: true, 
      reason: null,
      searchesRemaining: FREE_TIER_LIMIT - searchCount
    };
  } catch (error) {
    console.error('Error checking search permission:', error);
    return { 
      canSearch: true, // Allow search anyway to prevent blocking
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
    console.log(`Incrementing search count for user: ${userId}`);
    
    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      console.log(`User not found when incrementing count: ${userId}`);
      return false;
    }

    // If no subscription exists, create one
    if (!user.subscription) {
      console.log(`Creating new subscription for user: ${userId}`);
      try {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            plan: 'free',
            status: 'inactive',
            searchCount: 1
          },
        });
      } catch (error) {
        console.error("Error creating subscription:", error);
      }
      return true;
    }

    // If user has premium plan, don't increment count
    if (user.subscription.plan === 'premium' && user.subscription.status === 'active') {
      console.log(`User ${userId} has premium plan, not incrementing search count`);
      return true;
    }

    // Update search count for free users
    try {
      const newCount = (user.subscription.searchCount || 0) + 1;
      console.log(`Updating search count for user ${userId}: ${user.subscription.searchCount} → ${newCount}`);
      
      await prisma.subscription.update({
        where: { userId: user.id },
        data: { searchCount: newCount },
      });
    } catch (error) {
      console.error("Error updating search count:", error);
    }

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
    console.log('Resetting monthly search counts for all users');
    
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
