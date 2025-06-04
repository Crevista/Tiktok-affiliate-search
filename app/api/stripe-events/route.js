// app/api/stripe-events/route.js
// SUPER SIMPLE VERSION FOR TESTING

export async function GET() {
  return new Response("Webhook endpoint is working", { status: 200 });
}

export async function POST(request) {
  try {
    console.log("=== WEBHOOK CALLED ===");
    console.log("Method:", request.method);
    console.log("URL:", request.url);
    
    const body = await request.text();
    console.log("Body length:", body.length);
    
    // Try to parse the JSON
    const event = JSON.parse(body);
    console.log("Event type:", event.type);
    console.log("Event ID:", event.id);
    
    console.log("=== WEBHOOK SUCCESS ===");
    return new Response(JSON.stringify({ received: true }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("=== WEBHOOK ERROR ===");
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
