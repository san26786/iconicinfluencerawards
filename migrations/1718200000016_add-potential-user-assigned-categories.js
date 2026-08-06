/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.addColumns('potential_users', {
        assigned_categories: { type: 'jsonb', notNull: true, default: '[]' },
    });
};

exports.down = (pgm) => {
    pgm.dropColumns('potential_users', ['assigned_categories']);
};
