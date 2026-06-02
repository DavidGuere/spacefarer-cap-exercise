const cds = require('@sap/cds');

cds.test(__dirname + '/..');

const asAdmin = (fn) =>
  cds.tx({ user: new cds.User({ id: 'terran-admin', roles: ['admin'], attr: { planet: 'EARTH' } }) }, fn);

describe('@Before CREATE handler', () => {

  let srv;
  beforeAll(async () => { srv = await cds.connect.to('GalaxyService'); });

  test('rejects negative stardust', async () => {
    await expect(asAdmin(() =>
      srv.create('Spacefarers').entries({
        name: 'Bad', email: 'b@px.io', race_code: 'Terran',
        origin_code: 'EARTH',
        ship_ID: '11111111-aaaa-bbbb-cccc-111111111111',
        stardustCollected: -1
      })
    )).rejects.toThrow(/stardustCollected/);
  });

  test('zero stardust receives starter fuel grant', async () => {
    const row = await asAdmin(() =>
      srv.create('Spacefarers').entries({
        name: 'Zara', email: 'z@px.io', race_code: 'Protoss',
        origin_code: 'EARTH',
        ship_ID: '33333333-aaaa-bbbb-cccc-333333333333'
      })
    );
    expect(row.stardustCollected).toBe(50);
  });

  test('1500 stardust promotes Novice → Expert', async () => {
    const row = await asAdmin(() =>
      srv.create('Spacefarers').entries({
        name: 'Rex', email: 'r@px.io', race_code: 'Terran',
        origin_code: 'EARTH',
        ship_ID: '11111111-aaaa-bbbb-cccc-111111111111',
        stardustCollected: 1500, wormholeSkill_code: 'Novice'
      })
    );
    expect(row.wormholeSkill_code).toBe('Expert');
  });

});
