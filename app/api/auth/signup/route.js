import { hash } from 'bcryptjs';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { name, email, password, newsletter } = await request.json();
    
    console.log('Signup request received:', { name, email, newsletter });
    
    // Basic validation
    if (!name || !email || !password) {
      console.log('Missing required fields');
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      console.log('Password too short');
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    
    // Check if database connection works
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { 
          message: 'Database connection failed', 
          error: dbError.message,
          code: dbError.code
        },
        { status: 500 }
      );
    }
    
    // Check if user already exists
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      
      if (existingUser) {
        console.log('User already exists');
        return NextResponse.json(
          { message: 'User with this email already exists' },
          { status: 409 }
        );
      }
    } catch (findError) {
      console.error('Error checking existing user:', findError);
      return NextResponse.json(
        { 
          message: 'Error checking existing user', 
          error: findError.message 
        },
        { status: 500 }
      );
    }
    
    // Hash the password
    let hashedPassword;
    try {
      hashedPassword = await hash(password, 12);
      console.log('Password hashed successfully');
    } catch (hashError) {
      console.error('Password hashing error:', hashError);
      return NextResponse.json(
        { 
          message: 'Password hashing failed', 
          error: hashError.message 
        },
        { status: 500 }
      );
    }
    
    // Create the user
    try {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          newsletter: newsletter || false,
        },
      });
      
      console.log('User created successfully with ID:', user.id);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      return NextResponse.json(
        { 
          message: 'User created successfully',
          user: userWithoutPassword
        },
        { status: 201 }
      );
    } catch (createError) {
      console.error('User creation error:', createError);
      return NextResponse.json(
        { 
          message: 'Error creating user', 
          error: createError.message,
          code: createError.code
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { 
        message: 'Something went wrong',
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
