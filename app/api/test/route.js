// app/api/test/route.js
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simple GET endpoint that just returns JSON
export async function GET() {
  return NextResponse.json({
    message: 'Test API is working',
    timestamp: new Date().toISOString()
  });
}

// Simple POST endpoint that echoes back the request
export async function POST(req) {
  try {
    const body = await req.json();
    return NextResponse.json({
      message: 'Test API received POST request',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Error parsing request: ' + error.message
    }, { status: 400 });
  }
}
