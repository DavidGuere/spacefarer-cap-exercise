using GalaxyService as service from '../srv/galaxy-service';

annotate service.Spacefarers with @(
  UI: {
    HeaderInfo: {
      TypeName: 'Hero Commander', TypeNamePlural: 'Hero Commanders',
      Title:       { Value: name },
      Description: { Value: ship.name }
    },
    LineItem: [
      { Value: name },
      { Value: race.name,          Label: 'Race' },
      { Value: origin.name,        Label: 'Origin' },
      { Value: ship.name },
      { Value: stardustCollected,  Label: 'Stardust' },
      { Value: wormholeSkill.name, Label: 'Wormhole Skill' },
      { Value: suitColor.name,    Label: 'Suit Color' },
      { Value: position.title }
    ],
    SelectionFields: [
      race_code, origin_code, ship_ID, wormholeSkill_code, department_ID
    ],
    HeaderFacets: [
      { $Type: 'UI.ReferenceFacet', Label: 'Origin',
        Target: '@UI.FieldGroup#Origin' }
    ],
    FieldGroup #Origin: { Data: [
      { Value: origin.name },
      { Value: origin.sector }
    ]},
    Facets: [
      { $Type: 'UI.ReferenceFacet', ID: 'Commander', Label: 'Commander',
        Target: '@UI.FieldGroup#Commander' },
      { $Type: 'UI.ReferenceFacet', ID: 'Ship', Label: 'Ship',
        Target: '@UI.FieldGroup#Ship' },
      { $Type: 'UI.ReferenceFacet', ID: 'Organization', Label: 'Command Branch',
        Target: '@UI.FieldGroup#Organization' }
    ],
    FieldGroup #Commander: { Data: [
      { Value: name },
      { Value: email },
      { Value: race.name,      Label: 'Race' },
      { Value: origin.name,    Label: 'Origin Planet' },
      { Value: suitColor.name, Label: 'Suit Color' }
    ]},
    FieldGroup #Ship: { Data: [
      { Value: ship.name,           Label: 'Ship' },
      { Value: stardustCollected,   Label: 'Stardust' },
      { Value: wormholeSkill.name,  Label: 'Wormhole Skill' },
      { Value: ship.hullHardening,  Label: 'Ship Hull Hardening' },
      { Value: ship.capacity,       Label: 'Ship Capacity' }
    ]},
    FieldGroup #Organization: { Data: [
      { Value: department.name, Label: 'Department' },
      { Value: position.title,  Label: 'Position' },
      { Value: position.rank }
    ]}
  }
) {
  race          @( Common.ValueList.entity: 'Races',
                   Common.ValueListWithFixedValues,
                   Common.Text: race.name,
                   Common.TextArrangement: #TextOnly );
  origin        @( Common.ValueList.entity: 'Planets',
                   Common.ValueListWithFixedValues,
                   Common.Text: origin.name,
                   Common.TextArrangement: #TextOnly );
  ship          @( Common.ValueList.entity: 'Starships',
                   Common.ValueListWithFixedValues,
                   Common.Text: ship.name,
                   Common.TextArrangement: #TextOnly );
  department    @( Common.ValueList.entity: 'Departments',
                   Common.ValueListWithFixedValues,
                   Common.Text: department.name,
                   Common.TextArrangement: #TextOnly );
  position      @( Common.ValueList.entity: 'Positions',
                   Common.ValueListWithFixedValues,
                   Common.Text: position.title,
                   Common.TextArrangement: #TextOnly );
  wormholeSkill @( Common.ValueListWithFixedValues );
  suitColor     @( Common.ValueListWithFixedValues );
};

annotate service.Races with {
  code @title: 'Race';
  name @title: 'Race';
};

annotate service.Planets with {
  code   @title: 'Code';
  name   @title: 'Planet';
  sector @title: 'Sector';
};

annotate service.Departments with {
  ID          @title: 'ID';
  name        @title: 'Intergalactic Department';
  race        @title: 'Race';
  description @title: 'Description';
};

annotate service.Positions with {
  ID    @title: 'ID';
  title @title: 'Position';
  rank  @title: 'Rank';
};

annotate service.Starships with {
  ID             @title: 'ID';
  name           @title: 'Ship';
  race           @title: 'Race';
  shipClass      @title: 'Class';
  hullHardening  @title: 'Hull Hardening';
  capacity       @title: 'Capacity';
};

annotate service.SuitColors with {
  code @title: 'Suit Color';
  name @title: 'Suit Color';
};

annotate service.SkillLevels with {
  code @title: 'Skill Level';
  name @title: 'Skill Level';
};

annotate service.Spacefarers with {
  name                       @title: 'Hero';
  email                      @title: 'Notification Email';
  race                       @title: 'Race';
  origin                     @title: 'Origin Planet';
  ship                       @title: 'Ship';
  stardustCollected          @title: 'Stardust Collected';
  wormholeSkill              @title: 'Wormhole Navigation Skill';
  suitColor                  @title: 'Suit Color';
  department                 @title: 'Intergalactic Department';
  position                   @title: 'Position';
  enlistedAt                 @title: 'Enlisted At';
};

annotate service.Spacefarers with @(
  Capabilities.FilterRestrictions.FilterExpressionRestrictions: [
    { Property: stardustCollected, AllowedExpressions: 'SingleRange' }
  ]
);
