/* eslint-disable no-console */
//
//   node -r dotenv/config scripts/set-ceremony-details.js dotenv_config_path=.env.local
//   node -r dotenv/config scripts/set-ceremony-details.js dotenv_config_path=.env.local --year 2027
//
// Sets the confirmed ceremony details on the live site row. Only the venue and
// the day/month came from the organiser — everything else here is derived:
//
//   weekday   computed, not guessed: 29 Oct 2026 is a Thursday, 2027 a Friday
//   offset    UK clocks go back on the last Sunday of October, which is the
//             25th in 2026 (so the 29th is GMT) and the 31st in 2027 (BST)
//   time      10:00, confirmed by the organiser. The ceremony runs 10:00–16:30,
//             a daytime programme rather than an evening gala — CEREMONY_WINDOW
//             in lib/content.ts carries the pair for the copy and the JSON-LD.
//
// The entry deadline is deliberately left alone: it was not given, and guessing
// one is what put an invented date on the site in the first place.

const { Pool } = require('pg');

const SITE_ID = 15;
const VENUE_SHORT = 'Cardiff City Stadium';
const CITY = 'Cardiff';
const DAY = 29;
const MONTH = 9; // zero-based: October
const START_HOUR = 10;

function ukOffsetFor(year, month, day) {
  // BST runs from the last Sunday of March to the last Sunday of October.
  const lastSundayOf = (m) => {
    const last = new Date(Date.UTC(year, m + 1, 0));
    return last.getUTCDate() - last.getUTCDay();
  };
  const afterMarchSwitch =
    month > 2 || (month === 2 && day >= lastSundayOf(2));
  const beforeOctoberSwitch =
    month < 9 || (month === 9 && day < lastSundayOf(9));
  return afterMarchSwitch && beforeOctoberSwitch ? '+01:00' : '+00:00';
}

async function main() {
  const yearArg = process.argv.indexOf('--year');
  const year = yearArg > -1 ? Number(process.argv[yearArg + 1]) : 2026;
  if (!Number.isInteger(year)) throw new Error('--year needs a four-digit year');

  const noon = new Date(Date.UTC(year, MONTH, DAY, 12));
  const weekdayLong = noon.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
  const weekdayShort = noon.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
  const monthShort = noon.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
  const monthLong = noon.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
  const offset = ukOffsetFor(year, MONTH, DAY);

  const values = {
    event_date: `${DAY} ${monthShort} ${year}`,
    event_date_long: `${weekdayShort}, ${DAY} ${monthLong} ${year}`,
    event_date_iso: `${year}-${String(MONTH + 1).padStart(2, '0')}-${String(DAY).padStart(2, '0')}T${String(START_HOUR).padStart(2, '0')}:00:00${offset}`,
    event_city: CITY,
    venue_short: VENUE_SHORT,
    venue: `${VENUE_SHORT}, ${CITY}`,
  };

  console.log(`29 ${monthLong} ${year} is a ${weekdayLong}; UK offset ${offset}\n`);
  console.log('Setting:');
  for (const [k, v] of Object.entries(values)) console.log(`  ${k.padEnd(18)}${v}`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  const keys = Object.keys(values);
  await pool.query(
    `UPDATE sites SET ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')}, updated_at = now()
      WHERE id = $${keys.length + 1}`,
    [...keys.map((k) => values[k]), SITE_ID],
  );

  const after = (
    await pool.query(
      `SELECT event_date, event_date_long, event_date_iso, event_city, venue_short, venue,
              event_deadline_label
         FROM sites WHERE id = $1`,
      [SITE_ID],
    )
  ).rows[0];

  console.log('\nRow now reads:');
  for (const [k, v] of Object.entries(after)) {
    console.log(`  ${k.padEnd(22)}${v === null ? '(still empty)' : v}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
