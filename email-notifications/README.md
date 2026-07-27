# RoomGig Email Notifications Service

Gmail SMTP email-sending microservice used by the RoomGig mobile app.

## Setup

1. Copy `.env.example` to `.env` and fill in your Gmail credentials.
2. Generate a Gmail App Password in your Google account and use it for `SMTP_PASS`.
3. Install dependencies and start the server:

```bash
npm install
npm start
```

The server runs on `http://localhost:3000` by default.

## Endpoints

- `POST /send` — Send a single email
  - Body: `{ to, subject, html, text }`
- `GET /health` — Check service status

## Security notes

- Never commit `.env` to version control.
- Use Gmail App Passwords, not your account password.
- Expose this service behind HTTPS/ngrok when testing on a physical device.
