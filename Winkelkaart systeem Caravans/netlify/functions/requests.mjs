import {orderRepository,validOrder} from '../lib/orders.mjs';
import {render} from '../lib/mail-template.mjs';
const fields=['orderNumber','name','brand','model','year','length','width','mass','maximum','payload','beds','price','total','notes','quantity'];
const email=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const reply=(code,data)=>new Response(JSON.stringify(data),{status:code,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export async function handleRequest(request,repositoryFactory=orderRepository){
 if(request.method!=='POST')return reply(405,{error:'Niet toegestaan.'});
 const origin=request.headers.get('origin');
 if(origin && origin!==new URL(request.url).origin)return reply(403,{error:'Deze aanvraag is niet toegestaan.'});
 let values,options;
 try{
  const raw=await request.text();if(Buffer.byteLength(raw)>20000)return reply(413,{error:'De aanvraag is te groot.'});
  const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data)||data.website)throw Error();
  values=Object.fromEntries(fields.map(k=>[k,typeof data[k]==='string'?data[k].trim():'']));
  if(Object.values(values).some(v=>v.length>3000)||['name','brand','model','total','quantity'].some(k=>!values[k]))throw Error();
  if(!validOrder(values.orderNumber))throw Error();
  if(!/^\d+$/.test(values.quantity)||Number(values.quantity)<1||Number(values.quantity)>100)throw Error();
  for(const k of ['year','length','width','mass','maximum','payload','beds','price','total']){
   if(values[k]&&(!/^\d+(?:[.,]\d+)?$/.test(values[k])||!Number.isFinite(Number(values[k].replace(',','.')))||Number(values[k].replace(',','.'))>1e10))throw Error();
  }
  if(!Array.isArray(data.options)||data.options.length>30)throw Error();
  options=data.options.map(o=>{if(!o||typeof o!=='object')throw Error();return {name:typeof o.name==='string'?o.name.trim():'',price:typeof o.price==='string'?o.price.trim():''};}).filter(o=>o.name||o.price);
  if(options.some(o=>!o.name||o.name.length>150||(o.price&&(!/^\d+(?:[.,]\d{1,2})?$/.test(o.price)||Number(o.price.replace(',','.'))>1e10))))throw Error();
 }catch{return reply(400,{error:'Controleer de verplichte velden, het e-mailadres en de getallen.'});}
 const {BREVO_API_KEY,MAIL_FROM,MAIL_TO}=process.env;
 if(!BREVO_API_KEY||!MAIL_FROM||!MAIL_TO)return reply(503,{error:'E-mailverzending moet nog worden ingesteld. Er is niets verstuurd.'});
 try{
  const response=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':BREVO_API_KEY,'Content-Type':'application/json','Accept':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify({sender:{name:process.env.MAIL_FROM_NAME||'Caravan winkelkaart',email:MAIL_FROM},to:[{email:MAIL_TO}],subject:'Nieuwe aanvraag caravanwinkelkaart',htmlContent:render(values,options,new URL('/assets/logo-vanduinkerken.png',process.env.URL||request.url).href)})});
  if(!response.ok)throw Error();
  const result=await response.json();if(!result.messageId)throw Error();
  let historySaved=true,duplicate=false;
  if(values.orderNumber){
   try{({duplicate}=await repositoryFactory().remember(values.orderNumber));}
   catch{historySaved=false;}
  }
  return reply(200,{ok:true,historySaved,duplicate});
 }catch{return reply(502,{error:'Versturen is niet gelukt. Je gegevens blijven staan. Probeer het later opnieuw.'});}
}
// Netlify passes a context object as the second argument, not a repository factory.
export function createHandler(repositoryFactory=orderRepository){
 return async function handler(request,_context){return handleRequest(request,repositoryFactory);};
}
export default createHandler();
export const config={path:'/api/requests',rateLimit:{windowLimit:5,windowSize:60,aggregateBy:['ip','domain']}};
