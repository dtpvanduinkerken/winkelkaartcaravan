import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/requests.mjs';
const data={name:'Test',email:'test@example.com',brand:'Fendt',model:'<script>test</script>',total:'27850',quantity:'1',options:[{name:'Mover',price:'1495'}]};
const request=body=>new Request('https://example.netlify.app/api/requests',{method:'POST',headers:{origin:'https://example.netlify.app'},body:JSON.stringify(body)});
test('validatie en ontbrekende configuratie versturen niets',async()=>{
 delete process.env.BREVO_API_KEY;
 assert.equal((await handler(request({...data,options:[{name:'',price:'10'}]}))).status,400);
 assert.equal((await handler(request(data))).status,503);
 assert.equal((await handler(new Request('https://example.netlify.app/api/requests',{method:'POST',headers:{origin:'https://evil.example'},body:JSON.stringify(data)}))).status,403);
});
test('vaste ontvanger, veilige HTML, afzendernaam en foutafhandeling',async()=>{
 Object.assign(process.env,{BREVO_API_KEY:'test-key',MAIL_FROM:'sender@example.com',MAIL_TO:'marketing@vanduinkerken.com',MAIL_FROM_NAME:'Caravan winkelkaart'});
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async(url,init)=>{
   assert.equal(url,'https://api.brevo.com/v3/smtp/email');
   const payload=JSON.parse(init.body);
   assert.equal(payload.sender.name,'Caravan winkelkaart');
   assert.equal(payload.to[0].email,'marketing@vanduinkerken.com');
   assert.equal(payload.replyTo.email,'test@example.com');
   assert.ok(!payload.htmlContent.includes('<script>'));
   assert.match(payload.htmlContent,/1\.495,00/);assert.match(payload.htmlContent,/27\.850,00/);
   return new Response(JSON.stringify({messageId:'test-message'}),{status:201});
  };
  assert.equal((await handler(request({...data,to:'attacker@example.com'}))).status,200);
  globalThis.fetch=async()=>new Response('{}',{status:401});
  assert.equal((await handler(request(data))).status,502);
 }finally{globalThis.fetch=original;}
});
