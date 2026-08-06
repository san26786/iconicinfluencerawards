exports.up = async (sql) => {
  await sql`
    CREATE TABLE IF NOT EXISTS applications (
      id              serial PRIMARY KEY,
      site_id         int NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
      event_id        int REFERENCES events(id) ON DELETE SET NULL,
      ref_number      varchar(20) NOT NULL UNIQUE,
      status          varchar(30) NOT NULL DEFAULT 'submitted',
      first_name      varchar(100),
      last_name       varchar(100),
      email           varchar(255),
      phone           varchar(50),
      mobile          varchar(50),
      dob             date,
      gender          varchar(30),
      address         text,
      city            varchar(100),
      county          varchar(100),
      post_code       varchar(20),
      job_title       varchar(200),
      org_name        varchar(200),
      industry        varchar(100),
      org_phone       varchar(50),
      website         varchar(500),
      org_address     text,
      org_city        varchar(100),
      org_county      varchar(100),
      org_post_code   varchar(20),
      facebook        varchar(500),
      twitter         varchar(500),
      linkedin        varchar(500),
      instagram       varchar(500),
      brand_colour    varchar(20),
      trophy_name     varchar(100),
      trophy_title    varchar(100),
      trophy_message  varchar(300),
      eligibility_answers jsonb,
      application_answers jsonb,
      created_at      timestamptz NOT NULL DEFAULT now(),
      updated_at      timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS applications_site_id_idx ON applications(site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS applications_event_id_idx ON applications(event_id)`;
};

exports.down = async (sql) => {
  await sql`DROP TABLE IF EXISTS applications`;
};
