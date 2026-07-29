const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const twilio = require('twilio');
const { VoiceResponse } = require('twilio').twiml;

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://dial42demo.loca.lt';

function getVoiceUrl() {
  let parsedUrl;

  try {
    parsedUrl = new URL(publicBaseUrl);
  } catch (error) {
    throw new Error(`PUBLIC_BASE_URL is not a valid URL: ${publicBaseUrl}`);
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('Twilio requires an HTTPS public URL for voice webhooks. Use ngrok or Azure App Service and set PUBLIC_BASE_URL to that HTTPS URL.');
  }

  if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
    throw new Error('Twilio cannot reach localhost. Use a public HTTPS URL such as ngrok or Azure App Service for PUBLIC_BASE_URL.');
  }

  return `${parsedUrl.origin}/voice`;
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/call', async (req, res) => {
  const toNumber = req.body.phonenumber;

  if (!accountSid || !authToken || !twilioNumber) {
    return res.status(500).json({
      error: 'Missing Twilio configuration. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.'
    });
  }

  if (!toNumber) {
    return res.status(400).json({ error: 'Phone number is required.' });
  }

  try {
    const voiceUrl = getVoiceUrl();
    const client = twilio(accountSid, authToken);
    const call = await client.calls.create({
      to: toNumber,
      from: twilioNumber,
      url: voiceUrl,
      record: true,
      transcribe: true,
      recordingStatusCallback: `${publicBaseUrl}/recording`,
      recordingStatusCallbackMethod: 'POST'
    });

    res.json({ ok: true, sid: call.sid, to: toNumber, from: twilioNumber });
  } catch (error) {
    console.error('Failed to create Twilio call:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/voice', (_req, res) => {
  const response = new VoiceResponse();
  const gather = response.gather({
    input: 'dtmf',
    numDigits: 1,
    action: '/gather',
    method: 'POST',
    timeout: 5
  });

  gather.say({ voice: 'alice' }, 'Welcome to DIAL42.');
  gather.say({ voice: 'alice' }, 'For sales, press 1. For support, press 2. To repeat this menu, press 9.');
  response.say({ voice: 'alice' }, 'We did not receive any entry. Redirecting you to the main menu.');
  response.redirect('/voice');

  res.type('text/xml');
  res.send(response.toString());
});

app.post('/recording', (req, res) => {
  console.log('Recording callback received:', req.body);
  res.status(200).send('');
});

app.post('/gather', (req, res) => {
  const selectedDigit = req.body.Digits;
  const response = new VoiceResponse();

  if (selectedDigit === '1') {
    response.say({ voice: 'alice' }, 'You selected sales. Please wait while we connect you to our sales team.');
    response.pause({ length: 1 });
    response.say({ voice: 'alice' }, 'This is a prototype. In a real system, the call would now be routed to a sales agent.');
  } else if (selectedDigit === '2') {
    response.say({ voice: 'alice' }, 'You selected support. Please wait while we connect you to technical support.');
    response.pause({ length: 1 });
    response.say({ voice: 'alice' }, 'This is a prototype. In a real system, the call would now be routed to a support agent.');
  } else if (selectedDigit === '9') {
    response.redirect('/voice');
  } else {
    response.say({ voice: 'alice' }, 'Sorry, that is not a valid choice.');
    response.redirect('/voice');
  }

  res.type('text/xml');
  res.send(response.toString());
});

app.get('/voice', (_req, res) => {
  const response = new VoiceResponse();
  response.say({ voice: 'alice' }, 'Welcome to DIAL42.');
  res.type('text/xml');
  res.send(response.toString());
});

app.listen(port, () => {
  console.log(`DIAL42 prototype listening on http://localhost:${port}`);
});
