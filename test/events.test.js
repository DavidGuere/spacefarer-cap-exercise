const cds = require('@sap/cds');

cds.test(__dirname + '/..');

const asAdmin = (fn) =>
  cds.tx({ user: new cds.User({ id: 'terran-admin', roles: ['admin'], attr: { planet: 'EARTH' } }) }, fn);

test('emits SpacefarerEnlisted after a spacefarer is created', async () => {
  const galaxyService = await cds.connect.to('GalaxyService');
  const messagingService = await cds.connect.to('messaging');

  const enlistedEventPromise = new Promise((resolve, reject) => {
    messagingService.on('GalaxyService.SpacefarerEnlisted', resolve);
    setTimeout(() => reject(new Error('SpacefarerEnlisted not received within 2s')), 2000);
  });

  await asAdmin(() =>
    galaxyService.create('Spacefarers').entries({
      name: 'Test', email: 't@px.io', race_code: 'Terran',
      origin_code: 'EARTH',
      ship_ID: '11111111-aaaa-bbbb-cccc-111111111111',
      stardustCollected: 500
    })
  );

  const enlistedEvent = await enlistedEventPromise;
  expect(enlistedEvent.data).toMatchObject({
    name: 'Test',
    planet: 'EARTH',
    ship: '11111111-aaaa-bbbb-cccc-111111111111'
  });
});
