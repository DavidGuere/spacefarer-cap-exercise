const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
  const { Spacefarers } = this.entities;

  this.before('READ', Spacefarers, (req) => {
    const search = req.query?.SELECT?.search;
    const term = Array.isArray(search) && search.length === 1 && search[0]?.val?.trim();
    if (!term) return;

    const condition = {
      func: 'contains',
      args: [
        { func: 'tolower', args: [{ ref: ['name'] }] },
        { val: term.toLowerCase() }
      ]
    };
    const where = req.query.SELECT.where;
    req.query.SELECT.search = undefined;
    req.query.SELECT.where = where ? ['(', ...where, ')', 'and', condition] : [condition];
  });

  this.before('NEW', Spacefarers.drafts, (req) => {
    const planet = req.user?.attr?.planet;
    if (!planet) return;

    if (!req.data.origin_code) req.data.origin_code = planet;
  });

  this.before('CREATE', Spacefarers, (req) => {
    const s = req.data;

    if (!s.origin_code && req.user?.attr?.planet) {
      s.origin_code = req.user.attr.planet;
    }
    if (req.user?.attr?.planet && s.origin_code !== req.user.attr.planet) {
      return req.reject(403, 'Spacefarers can only be created for your own planet');
    }

    if (s.stardustCollected == null) s.stardustCollected = 0;
    if (s.stardustCollected < 0) return req.reject(400, 'stardustCollected must be >= 0');

    if (s.stardustCollected === 0) s.stardustCollected = 50;

    const tiers = ['Novice', 'Adept', 'Expert', 'Master'];
    const thresholds = [0, 100, 1000, 10000];
    let minTier = 0;
    for (let i = 0; i < thresholds.length; i++) {
      if (s.stardustCollected >= thresholds[i]) minTier = i;
    }
    const supplied = tiers.indexOf(s.wormholeSkill_code);
    const supplyIdx = supplied < 0 ? 0 : supplied;
    s.wormholeSkill_code = tiers[Math.max(minTier, supplyIdx)];

    s.enlistedAt = new Date().toISOString();
  });

  this.after('CREATE', Spacefarers, async (created) => {
    await this.emit('SpacefarerEnlisted', {
      spacefarerId: created.ID,
      name:         created.name,
      email:        created.email,
      planet:       created.origin_code,
      ship:         created.ship_ID,
      enlistedAt:   created.enlistedAt
    });
  });
});
