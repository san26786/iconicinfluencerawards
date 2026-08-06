/* eslint-disable camelcase */
// Migration 050: extend event_categories with full award-category fields
// (tagline, short_name, short_summary, eligibility, judging_criteria,
//  qualitative_criteria, metrics, additional_criteria, icon, entry_fee, promo)

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('event_categories', {
    tagline:              { type: 'varchar(300)' },
    short_name:           { type: 'varchar(100)' },
    short_summary:        { type: 'text' },
    eligibility:          { type: 'text' },
    judging_criteria:     { type: 'text' },
    qualitative_criteria: { type: 'text' },
    metrics:              { type: 'text' },
    additional_criteria:  { type: 'text' },
    icon:                 { type: 'varchar(50)' },
    entry_fee:            { type: 'numeric(10,2)', default: 0 },
    promo:                { type: 'boolean', notNull: true, default: false },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('event_categories', [
    'tagline', 'short_name', 'short_summary', 'eligibility',
    'judging_criteria', 'qualitative_criteria', 'metrics',
    'additional_criteria', 'icon', 'entry_fee', 'promo',
  ]);
};
