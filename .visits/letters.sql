CREATE TABLE IF NOT EXISTS guestbook_letters (
  id TEXT PRIMARY KEY NOT NULL,
  day TEXT NOT NULL,
  signature TEXT NOT NULL DEFAULT '' CHECK (length(signature) <= 40),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 1000),
  visibility TEXT NOT NULL CHECK (visibility IN ('private', 'public')),
  status TEXT NOT NULL,
  CHECK (
    (visibility = 'private' AND status = 'private') OR
    (visibility = 'public' AND status IN ('pending', 'approved', 'declined'))
  )
);

CREATE INDEX IF NOT EXISTS guestbook_letters_review
ON guestbook_letters (status, visibility);
