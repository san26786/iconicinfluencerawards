/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.addColumns('potential_users', {
        title: { type: 'varchar(120)' },
        position: { type: 'varchar(120)' },
    });
};

exports.down = (pgm) => {
    pgm.dropColumns('potential_users', ['title', 'position']);
};
