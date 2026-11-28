CREATE TABLE IF NOT EXISTS daily_visits (
  day TEXT NOT NULL,
  country TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 1 CHECK (views > 0),
  PRIMARY KEY (day, country)
) WITHOUT ROWID;
