/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.addColumns('judges', {
    work_phone:      { type: 'varchar(50)' },
    short_summary:   { type: 'varchar(150)' },
    profile_summary: { type: 'text' },
  });
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropColumns('judges', ['work_phone', 'short_summary', 'profile_summary']);
};
