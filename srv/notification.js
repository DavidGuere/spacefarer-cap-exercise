const cds = require('@sap/cds');
const nodemailer = require('nodemailer');

let transporter, account;

async function getTransporter () {
  if (transporter) return transporter;
  account = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass }
  });
  cds.log('notification').info(`Ethereal inbox: https://ethereal.email/ (user: ${account.user})`);
  return transporter;
}

cds.on('served', async () => {
  const messaging = await cds.connect.to('messaging');

  messaging.on('GalaxyService.SpacefarerEnlisted', async (msg) => {
    try {
      const { name, email, planet, enlistedAt } = msg.data;
      const t = await getTransporter();
      const info = await t.sendMail({
        from: '"Galactic HQ" <hq@galactic.test>',
        to: email,
        subject: `🚀 Welcome aboard, ${name}`,
        text: `Spacefarer ${name} of Planet ${planet}, enlistment confirmed at ${enlistedAt}. Safe travels.`,
        html: `<h1>Welcome, ${name}!</h1><p>Planet of origin: <b>${planet}</b></p><p>Enlisted: ${enlistedAt}</p>`
      });
      cds.log('notification').info(`Mail preview: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (e) {
      cds.log('notification').error('Cosmic mail failed (non-fatal):', e.message);
    }
  });
});
