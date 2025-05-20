// app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';

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
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log("User already exists:", email);
      return NextResponse.json({ 
        message: 'User with this email already exists'
      }, { status: 409 });
    }
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Create user
    console.log("Creating user:", email);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        newsletter: newsletter || false
      }
    });
    
    console.log("User created successfully:", user.id);
    
    // Create a free subscription for the user
    console.log("Creating free subscription for user:", user.id);
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'free',
        status: 'inactive',
        searchCount: 0
      }
    });
    
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
