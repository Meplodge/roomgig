import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getBaseEmailTemplate, getBaseTextTemplate } from './templates';

const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const FALLBACK_URL = `http://${DEFAULT_HOST}:3000/send`;
const EXTRA_URL = Constants.expoConfig?.extra?.emailApiUrl;
const ENV_URL = (process.env.EXPO_PUBLIC_EMAIL_API_URL || EXTRA_URL || FALLBACK_URL).trim();

// If the env URL is the generic API root without /send, append it.
const EMAIL_API_URL = /\/send\/?$/.test(ENV_URL) ? ENV_URL : ENV_URL.replace(/\/?$/, '') + '/send';

if (!process.env.EXPO_PUBLIC_EMAIL_API_URL) {
  console.warn(
    `EXPO_PUBLIC_EMAIL_API_URL is not set. Using default email server URL: ${EMAIL_API_URL}. ` +
    'Set EXPO_PUBLIC_EMAIL_API_URL in your app .env to your computer\'s IP for real devices.'
  );
}

/**
 * Send a raw email through the RoomGig email notification service.
 * Failures are logged but never thrown, so the app flow is never blocked.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!to || !subject || (!html && !text)) {
    console.warn('Email not sent: missing to, subject, or body');
    return { success: false, error: 'Missing required email fields' };
  }

  try {
    console.log(`📧 Sending email via ${EMAIL_API_URL} to ${to}`);
    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html, text }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.warn('Email service error:', result.error || response.statusText);
      return { success: false, error: result.error || response.statusText };
    }

    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.warn('Failed to reach email service:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send a templated email using the shared base template.
 */
export const sendTemplateEmail = async ({ to, subject, title, preheader, body }) => {
  const html = getBaseEmailTemplate({ title, preheader, body });
  const text = getBaseTextTemplate({ title, preheader, body: stripHtml(body) });
  return sendEmail({ to, subject, html, text });
};

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// ─────────────────────────────────────────────────────────────
// Crucial action helpers
// ─────────────────────────────────────────────────────────────

export const notifyPropertyListed = async ({ hostEmail, propertyName, city, imageUrl }) => {
  const imageTag = imageUrl
    ? `<img src="${imageUrl}" alt="${propertyName}" style="max-width:100%;height:auto;border-radius:8px;margin:16px 0;display:block;" />`
    : '';

  return sendTemplateEmail({
    to: hostEmail,
    subject: `Your property "${propertyName}" is now live on RoomGig`,
    title: 'Property Listed',
    preheader: `Congratulations, your property is now live.`,
    body: `<p>Hi there,</p>
<p>Your property <strong>${propertyName}</strong>${city ? ` in ${city}` : ''} has been successfully listed on RoomGig and is now visible to potential guests.</p>
${imageTag}
<p>You can manage your listing anytime from the app.</p>`,
  });
};

export const notifyBookingRequest = async ({ hostEmail, guestName, propertyName, checkIn, checkOut, totalAmount }) => {
  return sendTemplateEmail({
    to: hostEmail,
    subject: `New booking request for ${propertyName}`,
    title: 'New Booking Request',
    preheader: `${guestName} wants to book your property.`,
    body: `<p>Hi there,</p>
<p><strong>${guestName}</strong> has requested to book <strong>${propertyName}</strong>.</p>
<ul>
  <li><strong>Check-in:</strong> ${checkIn}</li>
  <li><strong>Check-out:</strong> ${checkOut}</li>
  <li><strong>Total:</strong> $${totalAmount}</li>
</ul>
<p>Open the app to accept or decline the request.</p>`,
  });
};

export const notifyBookingStatus = async ({ guestEmail, hostName, propertyName, status, checkIn, checkOut }) => {
  return sendTemplateEmail({
    to: guestEmail,
    subject: `Your booking for ${propertyName} was ${status}`,
    title: `Booking ${capitalize(status)}`,
    preheader: `Your host has ${status} your booking request.`,
    body: `<p>Hi there,</p>
<p>Your booking request for <strong>${propertyName}</strong> has been <strong>${status}</strong> by ${hostName}.</p>
<ul>
  <li><strong>Check-in:</strong> ${checkIn}</li>
  <li><strong>Check-out:</strong> ${checkOut}</li>
</ul>
<p>Open the app to view the full details.</p>`,
  });
};

export const notifyNewMessage = async ({ recipientEmail, senderName, messagePreview, propertyName }) => {
  return sendTemplateEmail({
    to: recipientEmail,
    subject: `New message from ${senderName}${propertyName ? ` about ${propertyName}` : ''}`,
    title: 'New Message',
    preheader: `You have a new message from ${senderName}.`,
    body: `<p>Hi there,</p>
<p><strong>${senderName}</strong> sent you a message${propertyName ? ` about <strong>${propertyName}</strong>` : ''}:</p>
<blockquote style="border-left: 3px solid #1a73e8; padding-left: 12px; margin: 16px 0; color: #555;">${messagePreview}</blockquote>
<p>Open the app to reply.</p>`,
  });
};

export const notifyNewReview = async ({ recipientEmail, reviewerName, propertyName, rating, comment }) => {
  return sendTemplateEmail({
    to: recipientEmail,
    subject: `New ${rating}-star review for ${propertyName}`,
    title: 'New Review',
    preheader: `${reviewerName} left you a ${rating}-star review.`,
    body: `<p>Hi there,</p>
<p><strong>${reviewerName}</strong> rated <strong>${propertyName}</strong> ${rating} out of 5 stars.</p>
<blockquote style="border-left: 3px solid #1a73e8; padding-left: 12px; margin: 16px 0; color: #555;">${comment || 'No written feedback.'}</blockquote>
<p>Open the app to view all your reviews.</p>`,
  });
};

export const notifyWelcome = async ({ email, name }) => {
  return sendTemplateEmail({
    to: email,
    subject: 'Welcome to RoomGig',
    title: 'Welcome to RoomGig',
    preheader: 'Thanks for signing up. Here is how to get started.',
    body: `<p>Hi ${name},</p>
<p>Welcome to RoomGig! Your account has been created successfully.</p>
<p>Start exploring properties, roommates, and more from the app.</p>`,
  });
};

export const notifyPasswordChanged = async ({ email }) => {
  return sendTemplateEmail({
    to: email,
    subject: 'Your RoomGig password was changed',
    title: 'Password Changed',
    preheader: 'Your password has been successfully updated.',
    body: `<p>Hi there,</p>
<p>Your RoomGig account password was just changed. If this was not you, please reset your password immediately.</p>
<p>Open the app to review your account security.</p>`,
  });
};

export const notifyRoommateListed = async ({ userEmail, listingTitle, city }) => {
  return sendTemplateEmail({
    to: userEmail,
    subject: `Your roommate listing "${listingTitle}" is now live`,
    title: 'Roommate Listing Live',
    preheader: 'Your roommate listing is now visible to others.',
    body: `<p>Hi there,</p>
<p>Your roommate listing <strong>${listingTitle}</strong>${city ? ` in ${city}` : ''} has been successfully posted on RoomGig.</p>
<p>Open the app to manage your listing.</p>`,
  });
};

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
