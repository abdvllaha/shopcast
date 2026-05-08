export async function GET() {
  return Response.json({ 
    cronSecret: process.env.CRON_SECRET ? 'EXISTS' : 'MISSING',
    length: process.env.CRON_SECRET?.length || 0
  })
}