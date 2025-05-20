import { NextResponse } from 'next/server';
import prisma from "../../../lib/prismaClient";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if we can connect to the database
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to connect to database'
    });
  }
}
