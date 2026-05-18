package com.spendlens.backend.gmail;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GmailConnectionRepository extends JpaRepository<GmailConnection, UUID> {

    Optional<GmailConnection> findFirstByUser_EmailOrderByUpdatedAtDesc(String email);

    Optional<GmailConnection> findByUser_IdAndGmailEmail(UUID userId, String gmailEmail);
}
