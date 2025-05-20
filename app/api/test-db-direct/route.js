import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Create a fresh client just for this request
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
  
  try {
    // Test with a simple SQL query that should work even if models are problematic
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    
    let userCount = null;
    try {
      // Try a simple model operation
      userCount = await prisma.user.count();
    } catch (modelError) {
      console.error('Model operation failed:', modelError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection test',
      timestamp: result[0].current_time,
      userCount: userCount,
      node_env: process.env.NODE_ENV,
      database_url: process.env.POSTGRES_PRISMA_URL 
        ? 'Configured (not shown for security)' 
        : 'Not configured'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to connect to database',
      type: error.constructor.name
    });
  } finally {
    // Explicitly disconnect
    await prisma.$disconnect();
  }
}
