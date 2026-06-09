const cds = require('@sap/cds');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TIERS = ['Novice', 'Adept', 'Expert', 'Master'];
const THRESHOLDS = [0, 100, 1000, 10000];

function validateAndPromote(s, req) {
  if (s.stardustCollected != null && s.stardustCollected < 0)
    return req.reject(400, 'stardustCollected must be >= 0');

  if (s.email != null && !EMAIL_RE.test(s.email))
    return req.reject(400, 'Invalid email format');

  if (s.stardustCollected != null) {
    let minTier = 0;
    for (let i = 0; i < THRESHOLDS.length; i++) {
      if (s.stardustCollected >= THRESHOLDS[i]) minTier = i;
    }
    const supplied = TIERS.indexOf(s.wormholeSkill_code);
    const supplyIdx = supplied < 0 ? 0 : supplied;
    s.wormholeSkill_code = TIERS[Math.max(minTier, supplyIdx)];
  }
}

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
    if (s.stardustCollected === 0) s.stardustCollected = 50;

    const result = validateAndPromote(s, req);
    if (result) return result;

    s.enlistedAt = new Date().toISOString();
  });

  this.before('UPDATE', Spacefarers, (req) => {
    return validateAndPromote(req.data, req);
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
