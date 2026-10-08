import {orderRepository,validOrder} from '../lib/orders.mjs';
const reply=(code,data)=>new Response(JSON.stringify(data),{status:code,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export default async function handler(request){
 if(request.method!=='GET')return reply(405,{error:'Niet toegestaan.'});
 try{
  const repo=orderRepository();const number=new URL(request.url).searchParams.get('number');
  if(number!==null){if(!validOrder(number))return reply(400,{error:'Ongeldig ordernummer.'});return reply(200,{used:Boolean(number.trim()&&await repo.find(number))});}
  return reply(200,{orders:await repo.list()});
 }catch{return reply(503,{error:'Het ordernummeroverzicht is tijdelijk niet beschikbaar.'});}
}
export const config={path:'/api/orders',rateLimit:{windowLimit:60,windowSize:60,aggregateBy:['ip','domain']}};
