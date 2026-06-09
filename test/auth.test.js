const cds = require('@sap/cds');
const crypto = require('crypto');
const { GET, POST } = cds.test(__dirname + '/..');

async function createAndActivateSpacefarer (spacefarerPayload) {
  const draftCreationResponse = await POST('/galaxy/Spacefarers', spacefarerPayload,
    { auth: { username: 'terran-admin', password: 'admin' } });

  return POST(
    `/galaxy/Spacefarers(ID=${draftCreationResponse.data.ID},IsActiveEntity=false)/GalaxyService.draftActivate`,
    {}, { auth: { username: 'terran-admin', password: 'admin' } }
  );
}

describe('GalaxyService authorization and planet isolation', () => {
  test('returns 401 when an unauthenticated user reads spacefarers', async () => {
    await expect(GET('/galaxy/Spacefarers'))
      .rejects.toMatchObject({ response: { status: 401 } });
  });

  test('returns only the signed-in planet in Planets value help', async () => {
    const terranPlanetsResponse = await GET('/galaxy/Planets',
      { auth: { username: 'terran-admin', password: 'admin' } });
    const zergPlanetsResponse = await GET('/galaxy/Planets',
      { auth: { username: 'zerg-admin', password: 'admin' } });

    expect(terranPlanetsResponse.data.value).toEqual([
      expect.objectContaining({ code: 'EARTH', name: 'Earth' })
    ]);
    expect(zergPlanetsResponse.data.value).toEqual([
      expect.objectContaining({ code: 'ZERG', name: 'Zerg Planet' })
    ]);
  });

  test('pre-fills only origin_code from the signed-in user planet when creating a draft', async () => {
    const { data: draftData } = await POST('/galaxy/Spacefarers', {},
      { auth: { username: 'terran-admin', password: 'admin' } });

    expect(draftData).toMatchObject({ origin_code: 'EARTH' });
    expect(draftData.race_code).toBeNull();
    expect(draftData.ship_ID).toBeNull();
  });

  test('returns only spacefarers whose names match the search term', async () => {
    const uniqueName = `SearchNeedle${crypto.randomUUID()}`;
    const searchPrefix = uniqueName.slice(0, -2);

    await createAndActivateSpacefarer({
      name: uniqueName, email: 'needle@demo.io', race_code: 'Terran',
      origin_code: 'EARTH',
      ship_ID: '11111111-aaaa-bbbb-cccc-111111111111',
      stardustCollected: 500
    });
    await createAndActivateSpacefarer({
      name: 'OtherHero', email: 'other@demo.io', race_code: 'Terran',
      origin_code: 'EARTH',
      ship_ID: '11111111-aaaa-bbbb-cccc-111111111111',
      stardustCollected: 500
    });

    const { data: searchResults } = await GET(`/galaxy/Spacefarers?$search=${searchPrefix}&$select=name`,
      { auth: { username: 'terran-admin', password: 'admin' } });

    expect(searchResults.value.map(spacefarer => spacefarer.name)).toEqual([uniqueName]);
  }, 15000);

  test('allows admin draft activation when draft origin matches the signed-in planet', async () => {
    const activationResponse = await createAndActivateSpacefarer({
      name: 'Nova', email: 'nova@demo.io', race_code: 'Terran',
      origin_code: 'EARTH',
      ship_ID: '11111111-aaaa-bbbb-cccc-111111111111',
      stardustCollected: 500
    });

    expect(activationResponse.status).toBeLessThan(300);
    expect(activationResponse.data).toMatchObject({
      name: 'Nova',
      origin_code: 'EARTH'
    });
  }, 15000);

  test('returns 403 when an admin activates a draft for a different planet', async () => {
    const draftCreationResponse = await POST('/galaxy/Spacefarers', {
      name: 'Vex', email: 'v@py.io', race_code: 'Terran',
      origin_code: 'ZERG',
      ship_ID: '11111111-aaaa-bbbb-cccc-111111111111',
      stardustCollected: 1500
    }, { auth: { username: 'terran-admin', password: 'admin' } });

    const { ID: draftId } = draftCreationResponse.data;
    await expect(POST(
      `/galaxy/Spacefarers(ID=${draftId},IsActiveEntity=false)/GalaxyService.draftActivate`,
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
