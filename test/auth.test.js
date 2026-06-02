const cds = require('@sap/cds');
const { GET, POST } = cds.test(__dirname + '/..');

describe('GalaxyService authorization', () => {
  test('rejects anonymous users', async () => {
    await expect(GET('/galaxy/Spacefarers'))
      .rejects.toMatchObject({ response: { status: 401 } });
  });

  test('isolates planet value help by logged-in planet', async () => {
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

  test('draft creation only pre-fills origin planet', async () => {
    const { data } = await POST('/galaxy/Spacefarers', {},
      { auth: { username: 'terran-admin', password: 'admin' } });

    expect(data).toMatchObject({ origin_code: 'EARTH' });
    expect(data.race_code).toBeNull();
    expect(data.ship_ID).toBeNull();
  });

  test('allows admins to activate spacefarers for their own planet', async () => {
    const draft = await POST('/galaxy/Spacefarers', {
      name: 'Nova', email: 'nova@demo.io', race_code: 'Terran',
      origin_code: 'EARTH',
      ship_ID: '11111111-aaaa-bbbb-cccc-111111111111',
      stardustCollected: 500
    }, { auth: { username: 'terran-admin', password: 'admin' } });

    const activated = await POST(
      `/galaxy/Spacefarers(ID=${draft.data.ID},IsActiveEntity=false)/GalaxyService.draftActivate`,
      {}, { auth: { username: 'terran-admin', password: 'admin' } }
    );

    expect(activated.status).toBeLessThan(300);
    expect(activated.data).toMatchObject({
      name: 'Nova',
      origin_code: 'EARTH'
    });
  }, 15000);

  test('rejects admin activation for another planet', async () => {
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

  test('rejects creates from read-only users', async () => {
    await expect(POST('/galaxy/Spacefarers', {
      name: 'X', email: 'x@demo.io', race_code: 'Zerg',
      origin_code: 'ZERG',
      ship_ID: '22222222-aaaa-bbbb-cccc-222222222222',
      stardustCollected: 500
    }, { auth: { username: 'zerg-user', password: 'user' } }))
      .rejects.toMatchObject({ response: { status: 403 } });
  });
});
