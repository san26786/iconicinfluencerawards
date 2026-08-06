/* eslint-disable camelcase */
// Adds organiser-controlled judging status columns to nominations.
// avg_score is the computed average of all judge scores for this nomination.
// The shortlisted / semifinalist / finalist flags are set by the organiser
// from Manage Award Night > Manage Applicant.

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('nominations', {
    avg_score:      { type: 'numeric(5,2)' },
    is_shortlisted: { type: 'boolean', notNull: true, default: false },
    is_semifinalist:{ type: 'boolean', notNull: true, default: false },
    is_finalist:    { type: 'boolean', notNull: true, default: false },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('nominations', ['avg_score', 'is_shortlisted', 'is_semifinalist', 'is_finalist']);
};
