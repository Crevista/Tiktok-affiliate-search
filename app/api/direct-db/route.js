import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Create a new connection pool for PostgreSQL
  const pool = new Pool({
    connectionString: process.env.POSTGRES_PRISMA_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection with a simple query
    const client = await pool.connect();
    try {
      // Basic connection test
      const result = await client.query('SELECT NOW() as time');
      
      // Try to query users table
      let users = null;
      try {
        const userResult = await client.query('SELECT COUNT(*) as count FROM "User"');
        users = {
          count: userResult.rows[0].count
        };
      } catch (userError) {
        users = {
          error: userError.message
        };
      }
      
      return NextResponse.json({
        success: true,
        connection: "Successful",
        time: result.rows[0].time,
        users: users
      });
    } finally {
      // Always release the client
      client.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  } finally {
    // End the pool
    pool.end();
  }
}

export async function POST(request) {
  // Create a new connection pool
  const pool = new Pool({
    connectionString: process.env.POSTGRES_PRISMA_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const data = await request.json();
    const { email, password } = data;
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false,
        error: 'Email and password are required'
      }, { status: 400 });
    }
    
    const client = await pool.connect();
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      // Check if user exists
      const userCheck = await client.query(
        'SELECT * FROM "User" WHERE email = $1',
        [email]
      );
      
      if (userCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ 
          success: false,
          error: 'User already exists'
        }, { status: 400 });
      }
      
      // Hash password - we'll use a simple hash for emergency purposes
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert new user
      const newUserResult = await client.query(
        'INSERT INTO "User" (id, email, password, name, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [
          `cuid-${Date.now()}`, // Simple ID generation
          email,
          hashedPassword,
          email.split('@')[0], // Simple name from email
          new Date(),
          new Date()
        ]
      );
      
      const userId = newUserResult.rows[0].id;
      
      // Insert subscription
      await client.query(
        'INSERT INTO "Subscription" (id, "userId", status, plan, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)',
        [
          `cuid-sub-${Date.now()}`, // Simple ID generation
          userId,
          'active',
          'free',
          new Date(),
          new Date()
        ]
      );
      
      // Commit transaction
      await client.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        userId: userId
      });
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release client
      client.release();
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  } finally {
    // End the pool
    pool.end();
  }
}
