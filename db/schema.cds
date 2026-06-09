namespace galactic;

using { managed, cuid, sap.common.CodeList } from '@sap/cds/common';

entity Races : CodeList {
  key code : String(20);
}

entity Planets {
  key code             : String(10);
  name                 : String(100) @mandatory;
  sector               : String(50);
  spacefarers          : Association to many Spacefarers on spacefarers.origin = $self;
}

entity Departments : cuid {
  name        : String(100) @mandatory;
  race        : Association to Races;
  description : String(500);
  positions   : Association to many Positions on positions.department = $self;
}

entity Positions : cuid {
  title        : String(100) @mandatory;
  rank         : Integer;
  department   : Association to Departments;
}

entity Starships : cuid {
  name          : String(100) @mandatory;
  race          : Association to Races @mandatory;
  shipClass     : String(50);
  hullHardening : Integer default 0 @assert.range: [0, 10000];
  capacity      : Integer default 0 @assert.range: [0, 1000];
}

entity SuitColors : CodeList {
  key code : String(20);
}

entity SkillLevels : CodeList {
  key code  : String(20);
  rankValue : Integer default 0;
}

entity Spacefarers : cuid, managed {
  name                         : String(100) @mandatory;
  email                        : String(255) @mandatory @assert.format: '^[^\s@]+@[^\s@]+\.[^\s@]+$';
  race                         : Association to Races      @mandatory;
  origin                       : Association to Planets    @mandatory;
  ship                         : Association to Starships  @mandatory;
  stardustCollected            : Integer default 0;
  wormholeSkill                : Association to SkillLevels default 'Novice';
  suitColor                    : Association to SuitColors  default 'TerranBlue';
  department                   : Association to Departments;
  position                     : Association to Positions;
  enlistedAt                   : Timestamp;
}
