import { prisma } from './prisma';

// Modify the `checkUserCanSearch` function to handle connection issues
export async function checkUserCanSearch(userId) {
  try {
    console.log(`Checking if user can search: ${userId}`);
    
    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    // Rest of your function...
  } catch (error) {
    console.error('Error checking user search permission:', error);
    // Return a default value to prevent application crashes
    return { 
      canSearch: true, // Allow search anyway to prevent blocking
      reason: 'Error checking search permission',
      searchesRemaining: null
    };
  }
}
