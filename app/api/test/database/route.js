import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    // Try to connect to the database
    await prisma.$connect();
    
    // Count users (a simple query)
    const userCount = await prisma.user.count();
    
    // Create a test user
    const hashedPassword = await require('bcryptjs').hash('testpassword', 12);
    
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
      },
    });
    
    return NextResponse.json({
      status: 'Database connection successful',
      userCount,
      testUser: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      message: 'You can now try logging in with test@example.com / testpassword'
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      status: 'Database connection failed',
      error: error.message 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
