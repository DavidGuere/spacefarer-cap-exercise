const cds = require('@sap/cds');

const TIERS = ['Novice', 'Adept', 'Expert', 'Master'];
const THRESHOLDS = [0, 100, 1000, 10000];

function validateAndPromote(spacefarerData, req) {
  if (spacefarerData.stardustCollected != null && spacefarerData.stardustCollected < 0)
    return req.reject(400, 'stardustCollected must be >= 0');

  if (spacefarerData.stardustCollected != null) {
    let minTier = 0;
    for (let i = 0; i < THRESHOLDS.length; i++) {
      if (spacefarerData.stardustCollected >= THRESHOLDS[i]) minTier = i;
    }
    const supplied = TIERS.indexOf(spacefarerData.wormholeSkill_code);
    const supplyIdx = supplied < 0 ? 0 : supplied;
    spacefarerData.wormholeSkill_code = TIERS[Math.max(minTier, supplyIdx)];
  }
}

module.exports = cds.service.impl(async function () {
  const { Spacefarers } = this.entities;

  this.before('READ', Spacefarers, (req) => {
    const searchTokens = req.query?.SELECT?.search;
    const searchTerm = Array.isArray(searchTokens) && searchTokens.length === 1 && searchTokens[0]?.val?.trim();
    if (!searchTerm) return;

    const searchCondition = {
      func: 'contains',
      args: [
        { func: 'tolower', args: [{ ref: ['name'] }] },
        { val: searchTerm.toLowerCase() }
      ]
    };
    const existingWhereClause = req.query.SELECT.where;
    req.query.SELECT.search = undefined;
    req.query.SELECT.where = existingWhereClause
      ? ['(', ...existingWhereClause, ')', 'and', searchCondition]
      : [searchCondition];
  });

  this.before('NEW', Spacefarers.drafts, (req) => {
    const userPlanet = req.user?.attr?.planet;
    if (!userPlanet) return;

    if (!req.data.origin_code) req.data.origin_code = userPlanet;
  });

  this.before('CREATE', Spacefarers, (req) => {
    const spacefarerData = req.data;
    const userPlanet = req.user?.attr?.planet;

    if (!spacefarerData.origin_code && userPlanet) {
      spacefarerData.origin_code = userPlanet;
    }
    if (req.user?.attr?.planet && s.origin_code !== req.user.attr.planet) {
      return req.reject(403, 'Spacefarers can only be created for your own planet');
    }

    if (spacefarerData.stardustCollected == null) spacefarerData.stardustCollected = 0;
    if (spacefarerData.stardustCollected === 0) spacefarerData.stardustCollected = 50;

    const validationError = validateAndPromote(spacefarerData, req);
    if (validationError) return validationError;

    spacefarerData.enlistedAt = new Date().toISOString();
  });

  this.before('UPDATE', Spacefarers, (req) => {
    return validateAndPromote(req.data, req);
  });

  this.after('CREATE', Spacefarers, async (createdSpacefarer) => {
    await this.emit('SpacefarerEnlisted', {
      spacefarerId: createdSpacefarer.ID,
      name:         createdSpacefarer.name,
      email:        createdSpacefarer.email,
      planet:       createdSpacefarer.origin_code,
      ship:         createdSpacefarer.ship_ID,
      enlistedAt:   createdSpacefarer.enlistedAt
    });
  });
});
