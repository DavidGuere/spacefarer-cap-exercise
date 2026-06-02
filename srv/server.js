const cds = require('@sap/cds');
require('./notification');

const demoUsers = {
  'terran-admin': 'admin',
  'zerg-admin': 'admin',
  'protos-admin': 'admin',
  'terran-user': 'user',
  'zerg-user': 'user',
  'protos-user': 'user'
};

function demoLoginPage () {
  return `<!doctype html>
<html>
  <head>
    <title>Demo Login</title>
    <style>
      body { background: #0b1117; color: #fff; font-family: Arial, sans-serif; padding: 3rem; }
      a { display: block; max-width: 18rem; margin: 0.75rem 0; padding: 0.8rem 1rem; border-radius: 0.4rem; background: #0a6ed1; color: #fff; text-decoration: none; }
      a:hover { background: #0854a0; }
    </style>
  </head>
  <body>
    <h1>Choose Demo User</h1>
    <h2>Admins</h2>
    <a href="/demo-login?user=terran-admin">Terran Admin - Earth</a>
    <a href="/demo-login?user=zerg-admin">Zerg Admin - Zerg Planet</a>
    <a href="/demo-login?user=protos-admin">Protos Admin - Protos Planet</a>
    <h2>Read-only Users</h2>
    <a href="/demo-login?user=terran-user">Terran User - Earth</a>
    <a href="/demo-login?user=zerg-user">Zerg User - Zerg Planet</a>
    <a href="/demo-login?user=protos-user">Protos User - Protos Planet</a>
  </body>
</html>`;
}

function readCookie (header, name) {
  return (header || '')
    .split(';')
    .map(cookie => cookie.trim().split('='))
    .find(([key]) => key === name)?.[1];
}

function demoUserFromAuthorization (header) {
  const [scheme, token] = (header || '').split(' ');
  if (scheme !== 'Basic' || !token) return '';
  const [user] = Buffer.from(token, 'base64').toString('utf8').split(':');
  return user;
}

cds.on('bootstrap', (app) => {
  app.use((req, res, next) => {
    const user = decodeURIComponent(readCookie(req.headers.cookie, 'demo_user') || '');
    if (demoUsers[user]) {
      req.headers.authorization = `Basic ${Buffer.from(`${user}:${demoUsers[user]}`).toString('base64')}`;
    }

    const authUser = demoUserFromAuthorization(req.headers.authorization);
    if (req.path.startsWith('/galaxy') && authUser && !demoUsers[authUser]) {
      res.set('WWW-Authenticate', 'Basic');
      return res.status(401).send('Unknown demo user');
    }

    next();
  });

  app.get('/demo-login', (req, res) => {
    const user = req.query.user;
    if (!user) return res.type('html').send(demoLoginPage());
    if (!demoUsers[user]) return res.status(400).send('Unknown demo user');

    res.cookie('demo_user', user, { sameSite: 'lax' });
    res.redirect('/spacefarers/webapp/index.html');
  });

  app.get('/demo-session', (req, res) => {
    const user = demoUserFromAuthorization(req.headers.authorization);
    const role = demoUsers[user] || '';
    res.json({
      user,
      canCreate: role === 'admin'
    });
  });

  app.get('/logout', (_req, res) => {
    res.clearCookie('demo_user');
    res.redirect('/demo-login');
  });
});

module.exports = cds.server;
