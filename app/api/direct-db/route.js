import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

// Helper function to modify the connection string
function modifyConnectionString(connString) {
  if (!connString) return "";
  
  // Remove any existing SSL parameters
  let modified = connString.replace(/[\?&]sslmode=[^&]+/, '');
  
  // Add our own SSL parameters
  if (modified.includes('?')) {
    // Add to existing parameters
    modified += '&sslmode=no-verify';
  } else {
    // Add as first parameter
    modified += '?sslmode=no-verify';
  }
  
  return modified;
}

export async function GET(request) {
  // Modify the connection string to disable SSL verification
  const connectionString = modifyConnectionString(process.env.POSTGRES_PRISMA_URL);
  
  console.log("Using modified connection string (partial):", 
    connectionString ? connectionString.substring(0, 20) + "..." : "Not configured");
  
  // Create a pool without SSL options (they're in the connection string now)
  const pool = new Pool({ connectionString });

  try {
    console.log("Attempting to connect to database...");
    // Test connection with a simple query
    const client = await pool.connect();
    console.log("Connected to database successfully");
    
    try {
      // Basic connection test
      const result = await client.query('SELECT NOW() as time');
      console.log("Query executed successfully");
      
      return NextResponse.json({
        success: true,
        connection: "Successful",
        time: result.rows[0].time
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
      connectionStringSample: connectionString ? 
        connectionString.substring(0, 20) + "..." : "Not configured"
    }, { status: 500 });
  } finally {
    // End the pool
    await pool.end().catch(err => console.error("Error ending pool:", err));
    console.log("Connection pool ended");
  }
}

export async function POST(request) {
  // For now, just return an error until we get the GET working
  return NextResponse.json({
    success: false,
    error: "User creation temporarily disabled until connection issues are resolved"
  }, { status: 503 });
}
