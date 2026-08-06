/* eslint-disable no-console */
//
//   node -r dotenv/config scripts/clear-unconfirmed-event-facts.js dotenv_config_path=.env.local
//
// Clears the event and contact fields on the live site row that were filled in
// with placeholder values rather than confirmed facts.
//
// The ceremony date, deadline and venue were invented when this site was first
// seeded, and the phone number was copied from bestbusinessawards.org — so
// callers reached a different organisation. All of it was being published as
// fact, including into the sitemap and the schema.org Event JSON-LD.
//
// The components already degrade properly: AwardsNight falls back to
// "Date to be announced" / "Venue to be announced", the countdown bands and the
// hero date/venue chips render only when their field is set, and buildJourney()
// and buildFaqs() switch to "announced soon" wording.
//
// Pass --print to see the current values without changing anything.
// Pass --restore to put the placeholder values back.

const { Pool } = require('pg');

const SITE_ID = 15;

// Fields cleared, and why each one is not a confirmed fact.
const CLEAR = {
  event_date: 'invented — "18 Jun 2027"',
  event_date_long: 'invented',
  event_date_iso: 'invented',
  event_deadline_iso: 'invented',
  event_deadline_label: 'invented — "28 May 2027"',
  venue: 'bestbusinessawards.org office address, not a booked ceremony venue',
  venue_short: 'same',
  phone_display: "bestbusinessawards.org's number — calls reached them, not this brand",
  phone_href: 'same',
};

// email was changed from the value the site row already had; putting it back
// rather than inventing a mailbox that may not exist.
const RESET = {
  email: 'organiser@propertyexcellenceawards.org',
};

const PLACEHOLDERS = {
  event_date: '18 Jun 2027',
  event_date_long: 'Fri, 18 June 2027',
  event_date_iso: '2027-06-18T18:00:00+01:00',
  event_deadline_iso: '2027-05-28T23:59:59+01:00',
  event_deadline_label: '28 May 2027',
  venue: 'The Leadenhall Building, 122 Leadenhall Street, London EC3V 4AB',
  venue_short: 'The Leadenhall Building',
  phone_display: '+44 20 3977 8512',
  phone_href: 'tel:+442039778512',
};

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const cols = [...Object.keys(CLEAR), ...Object.keys(RESET), 'event_city', 'address'];
  const before = (
    await pool.query(`SELECT ${cols.join(', ')} FROM sites WHERE id = $1`, [SITE_ID])
  ).rows[0];

  if (!before) throw new Error(`No sites row ${SITE_ID}`);

  console.log('Current values:');
  for (const c of cols) {
    console.log(`  ${c.padEnd(22)}${before[c] === null || before[c] === '' ? '(empty)' : before[c]}`);
  }

  if (process.argv.includes('--print')) {
    await pool.end();
    return;
  }

  if (process.argv.includes('--restore')) {
    const sets = Object.keys(PLACEHOLDERS).map((c, i) => `${c} = $${i + 1}`);
    await pool.query(
      `UPDATE sites SET ${sets.join(', ')}, updated_at = now() WHERE id = $${sets.length + 1}`,
      [...Object.values(PLACEHOLDERS), SITE_ID],
    );
    console.log('\nRestored the placeholder values.');
    await pool.end();
    return;
  }

  const clearSets = Object.keys(CLEAR).map((c) => `${c} = NULL`);
  const resetKeys = Object.keys(RESET);
  const resetSets = resetKeys.map((c, i) => `${c} = $${i + 1}`);

  await pool.query(
    `UPDATE sites
        SET ${[...clearSets, ...resetSets].join(', ')}, updated_at = now()
      WHERE id = $${resetKeys.length + 1}`,
    [...resetKeys.map((k) => RESET[k]), SITE_ID],
  );

  console.log('\nCleared:');
  for (const [c, why] of Object.entries(CLEAR)) console.log(`  ${c.padEnd(22)}${why}`);
  console.log('Reset:');
  for (const [c, v] of Object.entries(RESET)) console.log(`  ${c.padEnd(22)}-> ${v}`);
  console.log('\nKept (defensible, but still unconfirmed — worth checking):');
  console.log(`  event_city            ${before.event_city}`);
  console.log(`  address               ${before.address}`);

  await pool.end();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
