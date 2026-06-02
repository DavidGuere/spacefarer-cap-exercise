using { galactic as my } from '../db/schema';

@path: '/galaxy'
service GalaxyService @(requires: 'authenticated-user') {

  @odata.draft.enabled
  @restrict: [
    { grant: 'READ',
      to: 'authenticated-user',
      where: 'origin.code = $user.planet' },
    { grant: ['CREATE','UPDATE','DELETE'],
      to: 'admin',
      where: 'origin.code = $user.planet' }
  ]
  entity Spacefarers as projection on my.Spacefarers;

  @readonly entity Races        as projection on my.Races;
  @readonly @restrict: [
    { grant: 'READ',
      to: 'authenticated-user',
      where: 'code = $user.planet' }
  ]
  entity Planets as projection on my.Planets;
  @readonly entity Departments  as projection on my.Departments;
  @readonly entity Positions    as projection on my.Positions;
  @readonly entity Starships    as projection on my.Starships;
  @readonly entity SuitColors   as projection on my.SuitColors;
  @readonly entity SkillLevels  as projection on my.SkillLevels;

  event SpacefarerEnlisted : {
    spacefarerId : UUID;
    name         : String;
    email        : String;
    planet       : String;
    ship         : String;
    enlistedAt   : Timestamp;
  };
}
