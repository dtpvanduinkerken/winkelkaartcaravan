from html import escape
from decimal import Decimal

def euro(value):
    return '€ '+format(Decimal(value.replace(',','.')),',.2f').replace(',','X').replace('.',',').replace('X','.')

def render(values, options):
    def text(value):
        return escape(str(value), quote=True).replace('\n','<br>')
    def rows(items):
        return ''.join('<tr><td style="padding:10px 12px;border-bottom:1px solid #e4e9e3;color:#617065;width:55%">'+text(label)+'</td><td style="padding:10px 12px;border-bottom:1px solid #e4e9e3;font-weight:bold">'+text(value)+'</td></tr>' for label,value in items if value!='')
    def block(title, body):
        return '<h2 style="font-size:17px;color:#084422;margin:28px 0 12px">'+text(title)+'</h2>'+body
    def table(items):
        return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">'+rows(items)+'</table>'
    caravan=table([('Merk',values['brand']),('Model',values['model']),('Modeljaar',values['year']),('Aantal winkelkaarten',values['quantity'])])
    specifications=[]
    for key,label,unit in [('length','Totale lengte','cm'),('width','Breedte','cm'),('mass','Massa rijklaar','kg'),('maximum','Maximale massa','kg'),('payload','Bijlading','kg'),('beds','Slaapplaatsen','')]:
        if values[key]: specifications.append((label,values[key]+(' '+unit if unit else '')))
    prices=table([('Cataloguswaarde',euro(values['price']) if values['price'] else '')])
    prices+='<table role="presentation" width="100%" cellpadding="16" cellspacing="0" style="background:#eef4e6;margin-top:12px"><tr><td style="color:#084422;font-weight:bold">Totaalprijs</td><td align="right" style="color:#084422;font-size:25px;font-weight:bold">'+text(euro(values['total']))+'</td></tr></table>'
    option_list=[(str(option.get('name','')).strip(),str(option.get('price','')).strip()) for option in options if str(option.get('name','')).strip()]
    option_html=''
    if option_list:
        option_html='<table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;font-size:14px"><tr style="background:#eef4e6"><th align="left" scope="col">Optie / accessoire</th><th align="right" scope="col">Prijs</th></tr>'
        for name,price in option_list:
            option_html+='<tr><td style="border-bottom:1px solid #e4e9e3">'+text(name)+'</td><td align="right" style="border-bottom:1px solid #e4e9e3;white-space:nowrap">'+text(euro(price) if price else '—')+'</td></tr>'
        option_html+='</table>'
    body=block('De caravan',caravan)
    if specifications: body+=block('Specificaties',table(specifications))
    if option_list: body+=block('Opties en accessoires',option_html)
    body+=block('Prijs',prices)
    if values['notes']: body+=block('Opmerkingen','<p style="font-size:14px;line-height:1.6">'+text(values['notes'])+'</p>')
    body+=block('Aangevraagd door',table([('Naam',values['name']),('E-mailadres',values['email'])]))
    return '''<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f6f1;font-family:Arial,sans-serif;color:#20382b"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:white"><tr><td style="padding:28px;background:#084422;color:white"><p style="margin:0 0 10px;font-size:11px;letter-spacing:2px">VAN DUINKERKEN</p><h1 style="font-size:25px;margin:0">Aanvraag caravanwinkelkaart</h1></td></tr><tr><td style="padding:8px 28px 28px">'''+body+'''</td></tr><tr><td style="padding:18px 28px;background:#8cbe26;font-size:12px">Beantwoord deze e-mail om contact op te nemen met de aanvrager.</td></tr></table></td></tr></table></body></html>'''
