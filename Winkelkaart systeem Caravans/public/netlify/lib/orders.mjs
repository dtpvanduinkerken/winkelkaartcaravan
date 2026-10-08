import {getStore} from '@netlify/blobs';
import {createHash} from 'node:crypto';
export function normalizeOrder(value){return value.trim().normalize('NFKC').toUpperCase();}
export function validOrder(value){return typeof value==='string'&&value.length<=80&&!/[\u0000-\u001f\u007f]/u.test(value);}
const keyFor=number=>createHash('sha256').update(normalizeOrder(number)).digest('hex');
export function orderRepository(store=getStore({name:process.env.CONTEXT&&process.env.CONTEXT!=='production'?'caravan-orders-preview':'caravan-orders',consistency:'strong'})){
 return {
  async find(number){return store.get(keyFor(number),{type:'json'});},
  async remember(number){
   const result=await store.setJSON(keyFor(number),{number:number.trim(),createdAt:new Date().toISOString()},{onlyIfNew:true});
   return {duplicate:!result.modified};
  },
  async list(){
   const {blobs}=await store.list();
   const orders=[];
   for(let i=0;i<blobs.length;i+=30){
    const batch=await Promise.all(blobs.slice(i,i+30).map(blob=>store.get(blob.key,{type:'json'})));
    orders.push(...batch.filter(Boolean));
   }
   return orders.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  },
 };
}
