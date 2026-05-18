package com.spendlens.backend.gmail;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
public class GmailOAuthStateService {

    private static final long STATE_TTL_SECONDS = 600;

    private final byte[] signingKey;

    public GmailOAuthStateService(@Value("${app.jwt.secret}") String jwtSecret) {
        this.signingKey = jwtSecret.getBytes(StandardCharsets.UTF_8);
    }

    public String createState(UUID userId) {
        long expiresAtEpoch = Instant.now().getEpochSecond() + STATE_TTL_SECONDS;
        String payload = userId + "|" + expiresAtEpoch;
        String signature = sign(payload);
        String raw = payload + "|" + signature;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    public UUID validateState(String state) {
        if (state == null || state.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OAuth state");
        }

        try {
            String decoded = new String(Base64.getUrlDecoder().decode(state), StandardCharsets.UTF_8);
            String[] parts = decoded.split("\\|");

            if (parts.length != 3) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OAuth state");
            }

            UUID userId = UUID.fromString(parts[0]);
            long expiresAtEpoch = Long.parseLong(parts[1]);
            String signature = parts[2];
            String payload = parts[0] + "|" + parts[1];

            String expectedSignature = sign(payload);
            if (!MessageDigest.isEqual(
                    expectedSignature.getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8)
            )) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OAuth state signature");
            }

            if (Instant.now().getEpochSecond() > expiresAtEpoch) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OAuth state expired");
            }

            return userId;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid OAuth state");
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(signingKey, "HmacSHA256"));
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not sign OAuth state");
        }
    }
}
