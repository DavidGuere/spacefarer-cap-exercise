const cds = require('@sap/cds');

cds.test(__dirname + '/..');

const asAdmin = (fn) =>
  cds.tx({ user: new cds.User({ id: 'terran-admin', roles: ['admin'], attr: { planet: 'EARTH' } }) }, fn);

describe('Spacefarer creation', () => {

  let galaxyService;
  beforeAll(async () => { galaxyService = await cds.connect.to('GalaxyService'); });

  test('rejects spacefarer creation when stardustCollected is negative', async () => {
    await expect(asAdmin(() =>
      galaxyService.create('Spacefarers').entries({
        name: 'Bad', email: 'b@px.io', race_code: 'Terran',
        origin_code: 'EARTH',
        ship_ID: '11111111-aaaa-bbbb-cccc-111111111111',
        stardustCollected: -1
      })
    )).rejects.toThrow(/stardustCollected/);
  });

  test('grants starter stardust when stardustCollected is omitted', async () => {
    const createdSpacefarer = await asAdmin(() =>
      galaxyService.create('Spacefarers').entries({
        name: 'Zara', email: 'z@px.io', race_code: 'Protoss',
        origin_code: 'EARTH',
        ship_ID: '33333333-aaaa-bbbb-cccc-333333333333'
      })
    );
    expect(createdSpacefarer.stardustCollected).toBe(50);
  });

  test('promotes wormhole skill to Expert when stardustCollected is 1500', async () => {
    const createdSpacefarer = await asAdmin(() =>
      galaxyService.create('Spacefarers').entries({
        name: 'Rex', email: 'r@px.io', race_code: 'Terran',
        origin_code: 'EARTH',
        ship_ID: '11111111-aaaa-bbbb-cccc-111111111111',
        stardustCollected: 1500, wormholeSkill_code: 'Novice'
      })
    );
    expect(createdSpacefarer.wormholeSkill_code).toBe('Expert');
  });

});
