import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({
        authenticated: false,
        message: 'Not authenticated'
      });
    }
    
    // Get user from database (without password)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({
      authenticated: true,
      user,
      session
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      authenticated: false,
      error: error.message || 'An error occurred testing auth'
    });
  }
}
