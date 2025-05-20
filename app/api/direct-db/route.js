import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Create a new connection pool with proper SSL configuration
  const pool = new Pool({
    connectionString: process.env.POSTGRES_PRISMA_URL,
    ssl: {
      rejectUnauthorized: false // This allows self-signed certificates
    }
  });

  try {
    console.log("Attempting to connect to database...");
    // Test connection with a simple query
    const client = await pool.connect();
    console.log("Connected to database successfully");
    
    try {
      // Basic connection test
      const result = await client.query('SELECT NOW() as time');
      console.log("Query executed successfully:", result.rows[0]);
      
      // Try to query users table
      let users = null;
      try {
        const userResult = await client.query('SELECT COUNT(*) as count FROM "User"');
        users = {
          count: userResult.rows[0].count
        };
        console.log("User count:", users.count);
      } catch (userError) {
        console.error("Error querying User table:", userError);
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
      console.log("Database client released");
    }
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      stack: error.stack,
      connectionString: process.env.POSTGRES_PRISMA_URL ? 
        process.env.POSTGRES_PRISMA_URL.substring(0, 20) + "..." : 
        "Not configured"
    }, { status: 500 });
  } finally {
    // End the pool
    await pool.end().catch(err => console.error("Error ending pool:", err));
    console.log("Connection pool ended");
  }
}

export async function POST(request) {
  // Create a new connection pool with proper SSL configuration
  const pool = new Pool({
    connectionString: process.env.POSTGRES_PRISMA_URL,
    ssl: {
      rejectUnauthorized: false // This allows self-signed certificates
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
    
    console.log("Connecting to database to create user...");
    const client = await pool.connect();
    console.log("Connected successfully");
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      console.log("Transaction begun");
      
      // Check if user exists
      console.log("Checking if user exists:", email);
      const userCheck = await client.query(
        'SELECT * FROM "User" WHERE email = $1',
        [email]
      );
      
      if (userCheck.rows.length > 0) {
        console.log("User already exists");
        await client.query('ROLLBACK');
        return NextResponse.json({ 
          success: false,
          error: 'User already exists'
        }, { status: 400 });
      }
      
      // Hash password
      console.log("Hashing password...");
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Generate CUID-like ID (simplified version)
      const generateId = () => {
        return 'cuid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      };
      
      const userId = generateId();
      const now = new Date();
      
      // Insert new user
      console.log("Creating new user...");
      await client.query(
        'INSERT INTO "User" (id, email, password, name, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)',
        [
          userId,
          email,
          hashedPassword,
          email.split('@')[0], // Simple name from email
          now,
          now
        ]
      );
      
      // Insert subscription
      console.log("Creating subscription for user...");
      const subscriptionId = generateId();
      await client.query(
        'INSERT INTO "Subscription" (id, "userId", status, plan, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)',
        [
          subscriptionId,
          userId,
          'active',
          'free',
          now,
          now
        ]
      );
      
      // Commit transaction
      console.log("Committing transaction...");
      await client.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        userId: userId
      });
    } catch (error) {
      // Rollback transaction on error
      console.error("Error in transaction:", error);
      await client.query('ROLLBACK').catch(err => console.error("Rollback error:", err));
      throw error;
    } finally {
      // Release client
      client.release();
      console.log("Client released");
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  } finally {
    // End the pool
    await pool.end().catch(err => console.error("Error ending pool:", err));
    console.log("Pool ended");
  }
}
