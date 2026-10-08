const orderInput=document.querySelector('#order-number');
const orderWarning=document.querySelector('#order-warning');
const ordersDialog=document.querySelector('#orders-dialog');
const ordersStatus=document.querySelector('#orders-status');
const orderSearch=document.querySelector('#order-search');
const ordersList=document.querySelector('#orders-list');
let orderEntries=[];
let orderLookup=0;
const normalizedOrder=value=>value.trim().normalize('NFKC').toUpperCase();
async function checkOrder(){
 const lookup=++orderLookup,number=orderInput.value.trim();
 orderWarning.textContent='';
 if(!number)return;
 try{
  const response=await fetch('/api/orders?number='+encodeURIComponent(number),{cache:'no-store'});
  if(!response.ok)throw Error();
  const result=await response.json();
  if(lookup!==orderLookup)return;
  orderWarning.textContent=result.used?'Dit ordernummer is al een keer gebruikt. Je kunt de aanvraag alsnog versturen.':'';
 }catch{if(lookup===orderLookup)orderWarning.textContent='Eerder gebruik kon niet worden gecontroleerd. Probeer het later opnieuw.';}
}
orderInput.addEventListener('input',()=>{orderLookup++;orderWarning.textContent='';});
orderInput.addEventListener('blur',checkOrder);
function drawOrders(){
 const query=normalizedOrder(orderSearch.value);
 const entries=orderEntries.filter(entry=>normalizedOrder(entry.number).includes(query));
 ordersList.replaceChildren();
 ordersStatus.textContent=entries.length?`${entries.length} ordernummer${entries.length===1?'':'s'}`:(query?'Geen ordernummers gevonden.':'Er zijn nog geen ordernummers opgeslagen.');
 for(const entry of entries){
  const li=document.createElement('li'),number=document.createElement('strong'),date=document.createElement('time');
  number.textContent=entry.number;
  date.dateTime=entry.createdAt;
  date.textContent=new Intl.DateTimeFormat('nl-NL',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Amsterdam'}).format(new Date(entry.createdAt));
  li.append(number,date);ordersList.append(li);
 }
}
document.querySelector('#show-orders').addEventListener('click',async()=>{
 ordersDialog.showModal();orderSearch.value='';ordersList.replaceChildren();ordersStatus.textContent='Ordernummers laden…';orderSearch.focus();
 try{
  const response=await fetch('/api/orders',{cache:'no-store'});if(!response.ok)throw Error();
  const result=await response.json();orderEntries=result.orders;drawOrders();
 }catch{ordersStatus.textContent='Het overzicht kon niet worden geladen. Sluit het venster en probeer opnieuw.';}
});
document.querySelector('#close-orders').addEventListener('click',()=>ordersDialog.close());
orderSearch.addEventListener('input',drawOrders);
ordersDialog.addEventListener('click',event=>{if(event.target===ordersDialog){const bounds=ordersDialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)ordersDialog.close();}});
function resetOrderWarning(){orderLookup++;orderWarning.textContent='';}
