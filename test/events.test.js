const cds = require('@sap/cds');

cds.test(__dirname + '/..');

const asAdmin = (fn) =>
  cds.tx({ user: new cds.User({ id: 'terran-admin', roles: ['admin'], attr: { planet: 'EARTH' } }) }, fn);

test('emits SpacefarerEnlisted after a spacefarer is created', async () => {
  const galaxy = await cds.connect.to('GalaxyService');
  const messaging = await cds.connect.to('messaging');

  const received = new Promise((resolve, reject) => {
    messaging.on('GalaxyService.SpacefarerEnlisted', resolve);
    setTimeout(() => reject(new Error('SpacefarerEnlisted not received within 2s')), 2000);
  });

  await asAdmin(() =>
    galaxy.create('Spacefarers').entries({
      name: 'Test', email: 't@px.io', race_code: 'Terran',
      origin_code: 'EARTH',
      ship_ID: '11111111-aaaa-bbbb-cccc-111111111111',
      stardustCollected: 500
    })
  );

  const msg = await received;
  expect(msg.data).toMatchObject({
    name: 'Test',
    planet: 'EARTH',
    ship: '11111111-aaaa-bbbb-cccc-111111111111'
  });
});
