ALTER TABLE gmail_connections
    ADD COLUMN last_synced_at TIMESTAMP,
    ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN disconnected_at TIMESTAMP;
