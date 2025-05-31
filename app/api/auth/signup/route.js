// app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';
import { validateEmailForSignup } from '../../../../lib/emailValidator';

// Simple ID generator function
function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
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
    
    // NEW: Validate email (block disposable emails)
    const emailValidation = validateEmailForSignup(email);
    if (!emailValidation.valid) {
      console.log("Email validation failed:", emailValidation.message);
      return NextResponse.json({ 
        message: emailValidation.message
      }, { status: 400 });
    }
    
    // Using direct SQL query instead of Prisma ORM to avoid prepared statement issues
    try {
      // Check if user exists
      const existingUsers = await prisma.$queryRaw`
        SELECT id FROM "User" WHERE email = ${email} LIMIT 1
      `;
      
      if (existingUsers.length > 0) {
        console.log("User already exists:", email);
        return NextResponse.json({ 
          message: 'User with this email already exists'
        }, { status: 409 });
      }
      
      // Hash password
      const hashedPassword = await hash(password, 12);
      
      // Generate IDs
      const userId = generateId();
      const subscriptionId = generateId();
      
      // Insert user with raw SQL
      await prisma.$executeRaw`
        INSERT INTO "User" (
          id, name, email, password, newsletter, 
          "createdAt", "updatedAt"
        ) VALUES (
          ${userId}, 
          ${name || null}, 
          ${email}, 
          ${hashedPassword}, 
          ${newsletter || false}, 
          CURRENT_TIMESTAMP, 
          CURRENT_TIMESTAMP
        )
      `;
      
      console.log("User created successfully:", userId);
      
      // Create subscription with raw SQL
      await prisma.$executeRaw`
        INSERT INTO "Subscription" (
          id, "userId", plan, status, "searchCount",
          "createdAt", "updatedAt"
        ) VALUES (
          ${subscriptionId},
          ${userId},
          'free',
          'inactive',
          0,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `;
      
      console.log("Subscription created for user:", userId);
      
      return NextResponse.json({
        message: 'User created successfully',
        user: {
          id: userId,
          name: name,
          email: email
        }
      });
    } catch (error) {
      console.error("Database operation error:", error);
      throw error;
    }
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ 
      message: 'Error creating user: ' + error.message
    }, { status: 500 });
  }
}
