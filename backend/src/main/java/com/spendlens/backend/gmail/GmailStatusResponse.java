package com.spendlens.backend.gmail;

import java.time.LocalDateTime;

public record GmailStatusResponse(
        boolean connected,
        String gmailEmail,
        LocalDateTime lastSyncedAt,
        LocalDateTime createdAt
) {
}
