// app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';

// Helper function to safely execute Prisma operations with retry logic
async function safeExecute(operation, errorMessage = 'Database operation failed') {
  try {
    return await operation();
  } catch (error) {
    // If it's a prepared statement error, try to recover
    if (error.message.includes('prepared statement') || 
        error.code === '42P05') {
      console.log('Detected prepared statement error, retrying operation...');
      
      try {
        // Force a connection refresh and try again
        await prisma.$disconnect();
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        return await operation();
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        throw new Error(`${errorMessage}: ${retryError.message}`);
      }
    }
    throw new Error(`${errorMessage}: ${error.message}`);
  }
}

export async function POST(req) {
  try {
    console.log("Signup API called");
    const { name, email, password, newsletter } = await req.json();
    
    console.log("Signup data received:", { name, email, newsletter });
    
    // Simple validation
    if (!email || !password) {
      console.log("Missing email or password");
      return NextResponse.json({ 
        message: 'Email and password are required'
      }, { status: 400 });
    }
    
    if (password.length < 8) {
      console.log("Password too short");
      return NextResponse.json({ 
        message: 'Password must be at least 8 characters'
      }, { status: 400 });
    }
    
    // Check if user already exists - using safe execution pattern
    const existingUser = await safeExecute(
      () => prisma.user.findUnique({ where: { email } }),
      'Error checking existing user'
    );
    
    if (existingUser) {
      console.log("User already exists:", email);
      return NextResponse.json({ 
        message: 'User with this email already exists'
      }, { status: 409 });
    }
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Create user - using safe execution pattern
    console.log("Creating user:", email);
    const user = await safeExecute(
      () => prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          newsletter: newsletter || false
        }
      }),
      'Error creating user'
    );
    
    console.log("User created successfully:", user.id);
    
    // Create a free subscription for the user - using safe execution pattern
    console.log("Creating free subscription for user:", user.id);
    await safeExecute(
      () => prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'free',
          status: 'inactive',
          searchCount: 0
        }
      }),
      'Error creating subscription'
    );
    
    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ 
      message: 'Error creating user: ' + error.message
    }, { status: 500 });
  }
}
