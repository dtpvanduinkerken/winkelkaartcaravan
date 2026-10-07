"""Microsoft 365 server-to-server email; credentials stay on the server."""
import json
import os
import re
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen

def configured():
    return all(os.getenv(key) for key in ('M365_TENANT_ID', 'M365_CLIENT_ID', 'M365_CLIENT_SECRET', 'MAIL_FROM', 'MAIL_TO'))

def send_mail(message):
    tenant = os.environ['M365_TENANT_ID']
    if not re.fullmatch(r'[a-zA-Z0-9.-]+', tenant):
        raise ValueError('Invalid tenant identifier')
    token_request = Request(
        f'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
        data=urlencode({
            'client_id': os.environ['M365_CLIENT_ID'],
            'client_secret': os.environ['M365_CLIENT_SECRET'],
            'scope': 'https://graph.microsoft.com/.default',
            'grant_type': 'client_credentials',
        }).encode(),
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
    )
    with urlopen(token_request, timeout=20) as response:
        token = json.load(response)['access_token']
    payload = {'message': {
        'subject': str(message['Subject']),
        'body': {'contentType': 'Text', 'content': message.get_content()},
        'toRecipients': [{'emailAddress': {'address': os.environ['MAIL_TO']}}],
        'replyTo': [{'emailAddress': {'address': str(message['Reply-To'])}}],
    }, 'saveToSentItems': True}
    request = Request(
        'https://graph.microsoft.com/v1.0/users/' + quote(os.environ['MAIL_FROM'], safe='') + '/sendMail',
        data=json.dumps(payload).encode(),
        headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'},
    )
    with urlopen(request, timeout=20) as response:
        if response.status != 202:
            raise RuntimeError('Microsoft did not accept the email')
