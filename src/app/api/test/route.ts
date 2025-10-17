export async function GET() {
  return Response.json({ 
    message: "API is working!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}