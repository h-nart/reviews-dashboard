-- Table for storing Hostaway API access tokens
-- One token per client_id, using client_id as primary key

CREATE TABLE hostaway_tokens (
  client_id VARCHAR(255) PRIMARY KEY,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Index for efficient token lookup by expiration date
CREATE INDEX idx_hostaway_tokens_expires_at ON hostaway_tokens(expires_at);
