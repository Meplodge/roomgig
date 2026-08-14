require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_API_URL = (process.env.ADMIN_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const ADMIN_API_TOKEN = process.env.ADMIN_API_TOKEN || null;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─────────────────────────────────────────────────────────────
// SMTP configuration
// ─────────────────────────────────────────────────────────────
// The transporter is built from (in priority order):
//   1. config pushed via POST /config (from the dashboard Email Config page)
//   2. config fetched from admin-api /api/email-config on startup
//   3. .env fallback (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM)
//
// This lets a super admin change Gmail credentials from the dashboard without
// restarting the service or editing .env.

let transporter = null;
let currentConfig = {
  smtp_host: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtp_port: Number(process.env.SMTP_PORT || 465),
  smtp_username: process.env.SMTP_USER || '',
  smtp_password: process.env.SMTP_PASS || '',
  smtp_secure: Number(process.env.SMTP_PORT || 465) === 465,
  from_email: process.env.EMAIL_FROM || process.env.SMTP_USER || '',
  from_name: process.env.FROM_NAME || 'RoomGig',
  reply_to: process.env.REPLY_TO || '',
  enabled: process.env.SMTP_USER ? true : false,
};

const PASSWORD_MASK = '••••••••';

/** Builds (or rebuilds) the nodemailer transporter from currentConfig. */
const buildTransporter = () => {
  const port = Number(currentConfig.smtp_port) || 465;
  transporter = nodemailer.createTransport({
    host: currentConfig.smtp_host,
    port,
    secure: port === 465,
    auth: {
      user: currentConfig.smtp_username,
      pass: currentConfig.smtp_password,
    },
  });

  transporter.verify((error) => {
    if (error) {
      console.error('SMTP configuration error:', error.message);
    } else {
      console.log(`SMTP server is ready (host=${currentConfig.smtp_host} user=${currentConfig.smtp_username})`);
    }
  });
};

/**
 * Fetches email config from admin-api on startup so the service picks up
 * any changes made from the dashboard without a restart. Falls back to .env
 * if admin-api is unreachable or has no stored config.
 */
const fetchConfigFromApi = async () => {
  try {
    const headers = {};
    if (ADMIN_API_TOKEN) headers.Authorization = `Bearer ${ADMIN_API_TOKEN}`;
    const response = await fetch(`${ADMIN_API_URL}/api/email-config`, { headers });
    if (!response.ok) {
      console.log(`[config] admin-api returned ${response.status}, using .env defaults`);
      return;
    }
    const { data } = await response.json();
    if (!data || !data.smtp_host) {
      console.log('[config] no stored email config in admin-api, using .env defaults');
      return;
    }
    // Don't overwrite the .env password with the mask sentinel from the API.
    const merged = { ...currentConfig, ...data };
    if (merged.smtp_password === PASSWORD_MASK || !merged.smtp_password) {
      merged.smtp_password = currentConfig.smtp_password;
    }
    currentConfig = merged;
    console.log(`[config] loaded config from admin-api (host=${data.smtp_host} user=${data.smtp_username})`);
  } catch (err) {
    console.log(`[config] could not reach admin-api (${err.message}), using .env defaults`);
  }
};

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────

/** Returns the current config (password masked). */
app.get('/config', (req, res) => {
  const safe = { ...currentConfig };
  if (safe.smtp_password) safe.smtp_password = PASSWORD_MASK;
  res.json({ data: safe });
});

/**
 * Updates the SMTP transporter at runtime. Called by admin-api when the
 * super admin saves the Email Config page. Rebuilds the transporter and
 * verifies the new connection immediately.
 */
app.post('/config', (req, res) => {
  const body = req.body || {};
  const patch = { ...currentConfig };

  for (const key of Object.keys(currentConfig)) {
    if (body[key] === undefined) continue;
    if (key === 'smtp_password') {
      if (body[key] === PASSWORD_MASK || body[key] === '') continue;
      patch.smtp_password = String(body[key]);
    } else if (key === 'smtp_port') {
      patch.smtp_port = Number(body[key]) || 465;
    } else if (typeof currentConfig[key] === 'boolean') {
      patch[key] = !!body[key];
    } else {
      patch[key] = String(body[key] || '').trim();
    }
  }

  // Recalculate secure based on port
  patch.smtp_secure = Number(patch.smtp_port) === 465;

  currentConfig = patch;
  buildTransporter();

  console.log(`[config] updated via POST /config (host=${patch.smtp_host} user=${patch.smtp_username})`);
  res.json({ data: { ...patch, smtp_password: patch.smtp_password ? PASSWORD_MASK : '' } });
});

app.post('/send', async (req, res) => {
  const { to, subject, html, text } = req.body;

  console.log(`[send] to=${to} subject="${subject}"`);

  if (!to || !subject || (!html && !text)) {
    return res.status(400).json({
      error: 'Missing required fields: to, subject, and either html or text',
    });
  }

  if (!transporter) {
    return res.status(503).json({ success: false, error: 'SMTP transporter not initialized' });
  }

  const from = currentConfig.from_email
    ? `${currentConfig.from_name} <${currentConfig.from_email}>`
    : currentConfig.smtp_username;

  try {
    const mailOptions = {
      from,
      to,
      subject,
      text,
      html,
    };
    if (currentConfig.reply_to) mailOptions.replyTo = currentConfig.reply_to;

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Failed to send email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    smtp: {
      host: currentConfig.smtp_host,
      user: currentConfig.smtp_username,
      configured: Boolean(currentConfig.smtp_username && currentConfig.smtp_password),
    },
  });
});

// ─────────────────────────────────────────────────────────────
// Startup
// ─────────────────────────────────────────────────────────────
const start = async () => {
  // Try to load config from admin-api first (overrides .env if present).
  await fetchConfigFromApi();
  // Build the transporter with whatever config we ended up with.
  buildTransporter();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Email notification server running on port ${PORT}`);
  });
};

start();
