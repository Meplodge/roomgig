export const getBaseEmailTemplate = ({
  title = 'RoomGig',
  preheader = 'You have a new notification from RoomGig.',
  body = '<p>Hello,</p><p>You have a new update from RoomGig.</p>',
  unsubscribeLink = '#',
  footerAddress = '4019 Waterview Lane, Santa Fe, NM, New Mexico 87500',
  privacyPolicyUrl = 'https://tabular.email',
  contactUsUrl = 'https://tabular.email',
  year = new Date().getFullYear(),
} = {}) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f4f4f4; }
    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .header { background-color: #1a73e8; padding: 40px 30px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 28px; line-height: 36px; font-family: Georgia, serif; }
    .header p { margin: 12px 0 0; font-size: 16px; line-height: 24px; font-family: Arial, sans-serif; opacity: 0.9; }
    .content { padding: 40px 30px; font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #333333; }
    .content p { margin: 0 0 16px; }
    .button-wrapper { text-align: center; padding: 20px 0; }
    .button { display: inline-block; padding: 14px 28px; background-color: #1a73e8; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .footer { padding: 30px; text-align: center; font-family: Arial, sans-serif; font-size: 13px; line-height: 20px; color: #777777; background-color: #f9f9f9; }
    .footer a { color: #1a73e8; text-decoration: none; }
  </style>
</head>
<body>
  <div role="article" aria-roledescription="email" lang="en" style="background-color:#f4f4f4;padding:20px 0;">
    <!--[if mso]>
    <table role="presentation" width="600" align="center" style="width:600px;" cellpadding="0" cellspacing="0" border="0"><tr><td>
    <![endif]-->
    <div class="wrapper">
      <div class="header">
        <h1>${title}</h1>
        <p>${preheader}</p>
      </div>
      <div class="content">
        ${body}
      </div>
      <div class="footer">
        <p>${footerAddress}</p>
        <p>
          <a href="${unsubscribeLink}">Unsubscribe</a> &bull;
          <a href="${privacyPolicyUrl}">Privacy policy</a> &bull;
          <a href="${contactUsUrl}">Contact us</a>
        </p>
        <p>&copy; ${year} RoomGig. All rights reserved.</p>
      </div>
    </div>
    <!--[if mso]>
    </td></tr></table>
    <![endif]-->
  </div>
</body>
</html>`;
};

export const getBaseTextTemplate = ({
  title = 'RoomGig',
  preheader = 'You have a new notification from RoomGig.',
  body = 'Hello,\n\nYou have a new update from RoomGig.',
  unsubscribeLink = '#',
  footerAddress = '4019 Waterview Lane, Santa Fe, NM, New Mexico 87500',
  privacyPolicyUrl = 'https://tabular.email',
  contactUsUrl = 'https://tabular.email',
  year = new Date().getFullYear(),
} = {}) => {
  return `${title}\n${preheader}\n\n${body}\n\n${footerAddress}\nUnsubscribe: ${unsubscribeLink}\nPrivacy policy: ${privacyPolicyUrl}\nContact us: ${contactUsUrl}\n\n© ${year} RoomGig. All rights reserved.`;
};
