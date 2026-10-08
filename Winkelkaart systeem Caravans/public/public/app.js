const form=document.querySelector('#request');
const status=document.querySelector('#status');
const send=document.querySelector('#send');
const money=new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:2});
const number=new Intl.NumberFormat('nl-NL');
const specs={length:['Totale lengte','cm'],width:['Breedte','cm'],mass:['Massa rijklaar','kg'],maximum:['Maximale massa','kg'],payload:['Bijlading','kg'],beds:['Slaapplaatsen','']};
const optionRows=document.querySelector('#option-rows');
let optionId=0;
function readOptions(){
 return [...optionRows.children].map(row=>({name:row.querySelector('.option-name').value.trim(),price:row.querySelector('.option-price').value})).filter(option=>option.name||option.price!=='');
}
function addOption(){
 if(optionRows.children.length>=30)return;
 const row=document.createElement('div');row.className='option-row';
 const id=++optionId;
 row.innerHTML=`<label>Optie ${id}<input class="option-name" maxlength="150" placeholder="Bijv. mover"></label><label>Prijs (€)<input class="option-price" type="number" min="0" step="0.01" placeholder="0,00" aria-label="Prijs optie ${id} (€)"></label><button type="button" class="remove-option" aria-label="Optie ${id} verwijderen">×</button>`;
 row.querySelector('.remove-option').addEventListener('click',()=>{row.remove();updateOptions();preview();});
 optionRows.append(row);updateOptions();
 return row;
}
function updateOptions(){
 document.querySelector('#add-option').disabled=optionRows.children.length>=30;
}
document.querySelector('#add-option').addEventListener('click',()=>{const row=addOption();if(row)row.querySelector('input').focus();});
addOption();addOption();addOption();
function preview(){
 const data=Object.fromEntries(new FormData(form));
 document.querySelector('#preview-brand').textContent=data.brand||'MERK';
 document.querySelector('#preview-model').textContent=data.model||'Jouw caravan';
 document.querySelector('#preview-year').textContent=data.year?'Modeljaar '+data.year:'';
 document.querySelector('#preview-price').textContent=data.total!==''?money.format(Number(data.total)):'€ —';
 document.querySelector('#preview-options').textContent=[readOptions().map(option=>option.name+(option.price!==''?' · '+money.format(Number(option.price)):'')).join('\n'),data.notes].filter(Boolean).join('\n\n');
 const list=document.querySelector('#specs'); list.replaceChildren();
 for(const [key,[label,unit]] of Object.entries(specs)) if(data[key]!==''){
  const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');
  dt.textContent=label;dd.textContent=number.format(Number(data[key]))+(unit?' '+unit:'');row.append(dt,dd);list.append(row);
 }
}
form.addEventListener('input',()=>{for(const row of optionRows.children)row.querySelector('.option-name').setCustomValidity('');preview();});preview();
fetch('/api/status').then(response=>response.json()).then(data=>{if(!data.emailConfigured)status.textContent='E-mailverzending via Brevo moet nog worden geactiveerd. Er wordt nu niets verstuurd.';}).catch(()=>{status.textContent='De verzendserver is niet bereikbaar. Je aanvraag kan nu niet worden verstuurd.';});
form.addEventListener('submit',async event=>{
 event.preventDefault();
 for(const row of optionRows.children){
  const name=row.querySelector('.option-name');
  name.setCustomValidity(row.querySelector('.option-price').value!==''&&!name.value.trim()?'Vul de naam van de optie in.':'');
 }
 if(!form.reportValidity())return;
 send.disabled=true;status.textContent='Aanvraag versturen…';
 try{
  const data=Object.fromEntries(new FormData(form));
  const response=await fetch('/api/requests',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({...data,options:readOptions()})});
  if(response.status===429)throw new Error('Er zijn te veel aanvragen verstuurd. Wacht één minuut en probeer het opnieuw. Je gegevens blijven staan.');
  const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||'Versturen is niet gelukt. Je gegevens blijven staan.');
  form.reset();resetOrderWarning();optionRows.replaceChildren();optionId=0;addOption();addOption();addOption();preview();status.textContent=result.historySaved===false?'Je aanvraag is verstuurd, maar het ordernummer kon niet worden opgeslagen. Verstuur de aanvraag niet opnieuw.':'Je aanvraag is verstuurd. Bedankt!'+(result.duplicate?' Dit ordernummer was al eerder gebruikt.':'');
 }catch(error){status.textContent=error.message||'Versturen is niet gelukt. Probeer het later opnieuw.';}
 finally{send.disabled=false;}
});
