// app/api/webhook-simple/route.js
export async function POST(req) {
  console.log("Simple webhook called!");
  return new Response("Webhook received!", { status: 200 });
}

export async function GET(req) {
  return new Response("Simple webhook endpoint is working!", { status: 200 });
}
