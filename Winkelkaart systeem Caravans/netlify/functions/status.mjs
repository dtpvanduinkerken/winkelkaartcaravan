export default async()=>new Response(JSON.stringify({emailConfigured:Boolean(process.env.BREVO_API_KEY&&process.env.MAIL_FROM&&process.env.MAIL_TO)}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export const config={path:'/api/status'};
