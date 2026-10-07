import json, os, re, smtplib, ssl, time, threading
from email.message import EmailMessage
from email.utils import formataddr
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import microsoft_mail
from email_template import render

ROOT = Path(__file__).parent
# Optional local configuration; never served by the web server.
if (ROOT / '.env').exists():
    for line in (ROOT / '.env').read_text().splitlines():
        if line.strip() and not line.lstrip().startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            os.environ.setdefault(key.strip(), value.strip())
FIELDS = {'name':'Naam aanvrager','email':'E-mailadres','brand':'Merk','model':'Model','year':'Modeljaar','length':'Totale lengte (cm)','width':'Breedte (cm)','mass':'Massa rijklaar (kg)','maximum':'Toegestane maximale massa (kg)','payload':'Bijlading (kg)','beds':'Slaapplaatsen','price':'Cataloguswaarde (€)','total':'Totaalprijs (€)','options':'Opties en accessoires','notes':'Aanvullende tekst / opmerkingen','quantity':'Aantal winkelkaarten'}
EMAIL = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
recent = {}
lock = threading.Lock()

def configured():
    if os.getenv('MAIL_PROVIDER') == 'microsoft365':
        return microsoft_mail.configured()
    return all(os.getenv(k) for k in ('SMTP_HOST','SMTP_USER','SMTP_PASSWORD','MAIL_FROM','MAIL_TO'))

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT / 'public'),**kwargs)
    def log_message(self,format,*args):
        pass # Do not put submitted personal details in logs.
    def reply(self,code,payload):
        body=json.dumps(payload).encode()
        self.send_response(code)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Cache-Control','no-store')
        self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        if self.path == '/api/status':
            return self.reply(200,{'emailConfigured':configured()})
        return super().do_GET()
    def do_POST(self):
        if self.path != '/api/requests': return self.reply(404,{'error':'Niet gevonden.'})
        origin=self.headers.get('Origin')
        if origin and origin.split('://')[-1] != self.headers.get('Host'):
            return self.reply(403,{'error':'Deze aanvraag is niet toegestaan.'})
        try:
            size=int(self.headers.get('Content-Length','0'))
            if not 0 < size <= 20000: return self.reply(413,{'error':'De aanvraag is te groot.'})
            data=json.loads(self.rfile.read(size))
            if not isinstance(data,dict): raise ValueError()
            if data.get('website'): return self.reply(400,{'error':'Aanvraag afgewezen.'})
            options=data.get('options',[])
            if not isinstance(options,list) or len(options)>30: raise ValueError()
            option_lines=[]
            for option in options:
                if not isinstance(option,dict): raise ValueError()
                name=str(option.get('name','')).strip()
                price=str(option.get('price','')).strip()
                if not name and not price: continue
                if not name or len(name)>150: raise ValueError()
                if price and not re.fullmatch(r'\d+(?:[.,]\d{1,2})?',price): raise ValueError()
                formatted=''
                if price:
                    formatted=format(float(price.replace(',','.')),',.2f').replace(',','X').replace('.',',').replace('X','.')
                option_lines.append(name+(' — € '+formatted if price else ''))
            values={k:str(data.get(k,'')).strip() for k in FIELDS if k!='options'}
            values['options']='\n'.join(option_lines)
            if any(len(v)>3000 for v in values.values()): raise ValueError()
            if any(not values[k] for k in ('name','email','brand','model','total','quantity')): raise ValueError()
            if not EMAIL.fullmatch(values['email']) or '\n' in values['email'] or '\r' in values['email']: raise ValueError()
            if not values['quantity'].isdigit() or not 1<=int(values['quantity'])<=100: raise ValueError()
            for key in ('length','width','mass','maximum','payload','beds','price','total','year'):
                if values[key] and not re.fullmatch(r'\d+(?:[.,]\d+)?',values[key]): raise ValueError()
        except (ValueError,TypeError,json.JSONDecodeError):
            return self.reply(400,{'error':'Controleer de verplichte velden, het e-mailadres en de getallen.'})
        if not configured(): return self.reply(503,{'error':'E-mailverzending is nog niet ingesteld. Er is niets verstuurd.'})
        with lock:
            now=time.monotonic(); ip=self.client_address[0]
            for key in list(recent):
                if now-recent[key]>60: del recent[key]
            if ip in recent: return self.reply(429,{'error':'Wacht één minuut voordat je opnieuw verstuurt.'})
            recent[ip]=now
        msg=EmailMessage()
        msg['Subject']='Nieuwe aanvraag caravanwinkelkaart'
        msg['From']=formataddr((os.getenv('MAIL_FROM_NAME','Caravan winkelkaart'),os.environ['MAIL_FROM'])); msg['To']=os.environ['MAIL_TO']; msg['Reply-To']=values['email']
        msg.set_content('Nieuwe aanvraag winkelkaart\n\n'+'\n\n'.join(f'{label}:\n{values[k] or "—"}' for k,label in FIELDS.items()))
        msg.add_alternative(render(values,options),subtype='html')
        try:
            if os.getenv('MAIL_PROVIDER') == 'microsoft365':
                microsoft_mail.send_mail(msg)
            else:
                port=int(os.getenv('SMTP_PORT','587'))
                client=smtplib.SMTP_SSL if port==465 else smtplib.SMTP
                with client(os.environ['SMTP_HOST'],port,timeout=20) as smtp:
                    if port!=465: smtp.starttls(context=ssl.create_default_context())
                    smtp.login(os.environ['SMTP_USER'],os.environ['SMTP_PASSWORD'])
                    refused=smtp.send_message(msg)
                    if refused: raise smtplib.SMTPException('Recipient refused')
        except Exception:
            with lock: recent.pop(ip,None)
            return self.reply(502,{'error':'Versturen is niet gelukt. Je gegevens staan nog in het formulier. Probeer het later opnieuw.'})
        self.reply(200,{'ok':True})

if __name__ == '__main__':
    port=int(os.getenv('PORT','8080'))
    print(f'Winkelkaartformulier: http://localhost:{port}',flush=True)
    ThreadingHTTPServer((os.getenv('HOST','127.0.0.1'),port),Handler).serve_forever()
