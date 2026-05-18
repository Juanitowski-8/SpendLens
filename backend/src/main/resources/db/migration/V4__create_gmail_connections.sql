CREATE TABLE gmail_connections (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    gmail_email VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_gmail_connections_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_gmail_connections_user_email
        UNIQUE (user_id, gmail_email)
);

CREATE INDEX idx_gmail_connections_user_id ON gmail_connections(user_id);
