import { NextResponse } from 'next/server';
import { prisma } from "../../../lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try a simple SQL query to check connection
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    
    // If successful, try a simple model operation
    let userCount = null;
    try {
      userCount = await prisma.user.count();
    } catch (modelError) {
      console.error('Model operation failed:', modelError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      timestamp: result[0].current_time,
      userCount: userCount,
      node_env: process.env.NODE_ENV,
      // Show partial database URL (for security)
      database_url: process.env.POSTGRES_PRISMA_URL 
        ? `${process.env.POSTGRES_PRISMA_URL.substring(0, 20)}...` 
        : 'Not configured'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to connect to database',
      type: error.constructor.name
    });
  }
}
