/* eslint-disable camelcase */

// Promote the imported custom field "gender" to a first-class column on
// potential_users WITHOUT losing any data:
//   1. add a real `gender` column,
//   2. copy every existing custom->>'gender' value into it,
//   3. strip the now-duplicated key out of the custom JSONB,
//   4. remove the "gender" entry from the custom-field registry.
// (The separate "genderConfidence110" custom field is intentionally left alone.)

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns('potential_users', {
    gender: { type: 'varchar(20)' },
  });
  pgm.sql(
    `UPDATE potential_users
       SET gender = NULLIF(btrim(custom->>'gender'), '')
     WHERE custom ? 'gender'`,
  );
  pgm.sql(
    `UPDATE potential_users
       SET custom = custom - 'gender'
     WHERE custom ? 'gender'`,
  );
  pgm.sql(`DELETE FROM potential_user_fields WHERE key = 'gender'`);
};

exports.down = (pgm) => {
  // Move the values back into custom and re-register the field.
  pgm.sql(
    `UPDATE potential_users
       SET custom = coalesce(custom, '{}'::jsonb) || jsonb_build_object('gender', gender)
     WHERE gender IS NOT NULL AND btrim(gender) <> ''`,
  );
  pgm.sql(
    `INSERT INTO potential_user_fields (key, label)
     VALUES ('gender', 'Gender')
     ON CONFLICT (key) DO NOTHING`,
  );
  pgm.dropColumns('potential_users', ['gender']);
};
