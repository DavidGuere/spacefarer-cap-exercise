const cds = require('@sap/cds');
const crypto = require('crypto');
const { GET, POST } = cds.test(__dirname + '/..');

async function createSpacefarer (entry) {
  const draft = await POST('/galaxy/Spacefarers', entry,
    { auth: { username: 'terran-admin', password: 'admin' } });

  return POST(
    `/galaxy/Spacefarers(ID=${draft.data.ID},IsActiveEntity=false)/GalaxyService.draftActivate`,
    {}, { auth: { username: 'terran-admin', password: 'admin' } }
  );
}

describe('GalaxyService authorization and planet isolation', () => {
  test('returns 401 when an unauthenticated user reads spacefarers', async () => {
    await expect(GET('/galaxy/Spacefarers'))
      .rejects.toMatchObject({ response: { status: 401 } });
  });

  test('returns only the signed-in planet in Planets value help', async () => {
    const terran = await GET('/galaxy/Planets',
      { auth: { username: 'terran-admin', password: 'admin' } });
    const zerg = await GET('/galaxy/Planets',
      { auth: { username: 'zerg-admin', password: 'admin' } });

    expect(terran.data.value).toEqual([
      expect.objectContaining({ code: 'EARTH', name: 'Earth' })
    ]);
    expect(zerg.data.value).toEqual([
      expect.objectContaining({ code: 'ZERG', name: 'Zerg Planet' })
    ]);
  });

  test('pre-fills only origin_code from the signed-in user planet when creating a draft', async () => {
    const { data } = await POST('/galaxy/Spacefarers', {},
      { auth: { username: 'terran-admin', password: 'admin' } });

    expect(data).toMatchObject({ origin_code: 'EARTH' });
    expect(data.race_code).toBeNull();
    expect(data.ship_ID).toBeNull();
  });

  test('returns only spacefarers whose names match the search term', async () => {
    const uniqueName = `SearchNeedle${crypto.randomUUID()}`;
    const search = uniqueName.slice(0, -2);

    await createSpacefarer({
      name: uniqueName, email: 'needle@demo.io', race_code: 'Terran',
      origin_code: 'EARTH',
      ship_ID: '11111111-aaaa-bbbb-cccc-111111111111',
      stardustCollected: 500
    });
    await createSpacefarer({
      name: 'OtherHero', email: 'other@demo.io', race_code: 'Terran',
      origin_code: 'EARTH',
      ship_ID: '11111111-aaaa-bbbb-cccc-111111111111',
      stardustCollected: 500
    });

    const { data } = await GET(`/galaxy/Spacefarers?$search=${search}&$select=name`,
      { auth: { username: 'terran-admin', password: 'admin' } });

    expect(data.value.map(row => row.name)).toEqual([uniqueName]);
  }, 15000);

  test('allows admin draft activation when draft origin matches the signed-in planet', async () => {
    const activated = await createSpacefarer({
      name: 'Nova', email: 'nova@demo.io', race_code: 'Terran',
      origin_code: 'EARTH',
      ship_ID: '11111111-aaaa-bbbb-cccc-111111111111',
      stardustCollected: 500
    });

    expect(activated.status).toBeLessThan(300);
    expect(activated.data).toMatchObject({
      name: 'Nova',
      origin_code: 'EARTH'
    });
  }, 15000);

  test('returns 403 when an admin activates a draft for a different planet', async () => {
    const draft = await POST('/galaxy/Spacefarers', {
      name: 'Vex', email: 'v@py.io', race_code: 'Terran',
      origin_code: 'ZERG',
      ship_ID: '11111111-aaaa-bbbb-cccc-111111111111',
      stardustCollected: 1500
    }, { auth: { username: 'terran-admin', password: 'admin' } });

    const { ID } = draft.data;
    await expect(POST(
      `/galaxy/Spacefarers(ID=${ID},IsActiveEntity=false)/GalaxyService.draftActivate`,
      {}, { auth: { username: 'terran-admin', password: 'admin' } }
    )).rejects.toMatchObject({ response: { status: 403 } });
  }, 15000);

  test('returns 403 when a read-only user creates a spacefarer draft', async () => {
    await expect(POST('/galaxy/Spacefarers', {
      name: 'X', email: 'x@demo.io', race_code: 'Zerg',
      origin_code: 'ZERG',
      ship_ID: '22222222-aaaa-bbbb-cccc-222222222222',
      stardustCollected: 500
    }, { auth: { username: 'zerg-user', password: 'user' } }))
      .rejects.toMatchObject({ response: { status: 403 } });
  });
});
