# DIAL42 Prototype

This prototype shows a simple way to: changes
- create a Twilio voice dialer UI,
- place outbound calls from a web form,
- answer inbound calls through a Twilio webhook.

## 1. Create a Twilio account
1. Sign up at https://www.twilio.com/
2. Verify your email and phone number.
3. Open the Twilio Console and buy a phone number.

## 2. Configure environment variables
Copy .env.example to .env and fill in your Twilio credentials.

```bash
cp .env.example .env
```

## 3. Run locally
```bash
npm install
npm start
```

Open http://localhost:3000.

## 4. Expose the app for Twilio webhooks
Because Twilio needs a public URL, use ngrok or Azure App Service.

```bash
ngrok http 3000
```

Set the Twilio Voice webhook for your phone number to:

```text
https://dial42demo.loca.lt/voice
```

## 5. Deploy to Azure App Service
1. Create an Azure App Service.
2. Set the same environment variables in App Settings.
3. Deploy this folder.

## 6. Prototype flow
- Enter a phone number in the UI and click Dial.
- Twilio places the outbound call using your Twilio number.
- The call is answered by the /voice endpoint and returns TwiML.

This is a good foundation for an AI-powered contact-center workflow that can later connect to Azure OpenAI, Azure Communication Services, or a queueing system.
