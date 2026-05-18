package com.spendlens.backend.gmail;

import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleRefreshTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Profile;
import com.spendlens.backend.users.User;
import com.spendlens.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
public class GmailOAuthService {

    private static final Logger log = LoggerFactory.getLogger(GmailOAuthService.class);

    private final GmailOAuthProperties properties;
    private final GmailConnectionRepository connectionRepository;
    private final UserRepository userRepository;
    private final GmailOAuthStateService stateService;

    public GmailOAuthService(
            GmailOAuthProperties properties,
            GmailConnectionRepository connectionRepository,
            UserRepository userRepository,
            GmailOAuthStateService stateService
    ) {
        this.properties = properties;
        this.connectionRepository = connectionRepository;
        this.userRepository = userRepository;
        this.stateService = stateService;
    }

    public String buildAuthorizationUrl(UUID userId) {
        validateOAuthConfiguration();

        String state = stateService.createState(userId);

        return "https://accounts.google.com/o/oauth2/v2/auth"
                + "?client_id=" + encode(properties.getClientId())
                + "&redirect_uri=" + encode(properties.getRedirectUri())
                + "&response_type=code"
                + "&scope=" + encode(properties.getScopes())
                + "&access_type=offline"
                + "&prompt=consent"
                + "&state=" + encode(state);
    }

    public void handleOAuthCallback(String code, String state) {
        UUID userId = stateService.validateState(state);
        GoogleTokenResponse tokenResponse = exchangeCodeForTokens(code);
        String gmailEmail = fetchGmailAddress(tokenResponse.getAccessToken());
        saveConnection(userId, gmailEmail, tokenResponse);
    }

    public GoogleTokenResponse exchangeCodeForTokens(String code) {
        validateOAuthConfiguration();

        try {
            return new GoogleAuthorizationCodeTokenRequest(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance(),
                    properties.getClientId(),
                    properties.getClientSecret(),
                    code,
                    properties.getRedirectUri()
            ).execute();
        } catch (IOException | GeneralSecurityException exception) {
            log.warn("Gmail OAuth token exchange failed");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not exchange Gmail authorization code");
        }
    }

    public GmailConnection saveConnection(UUID userId, String gmailEmail, GoogleTokenResponse tokenResponse) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = tokenResponse.getExpiresInSeconds() != null
                ? now.plusSeconds(tokenResponse.getExpiresInSeconds())
                : null;

        GmailConnection connection = connectionRepository
                .findByUser_IdAndGmailEmail(userId, normalizeEmail(gmailEmail))
                .orElseGet(GmailConnection::new);

        if (connection.getId() == null) {
            connection.setId(UUID.randomUUID());
            connection.setUser(user);
            connection.setGmailEmail(normalizeEmail(gmailEmail));
            connection.setCreatedAt(now);
        }

        connection.setAccessToken(tokenResponse.getAccessToken());

        if (tokenResponse.getRefreshToken() != null && !tokenResponse.getRefreshToken().isBlank()) {
            connection.setRefreshToken(tokenResponse.getRefreshToken());
        }

        connection.setExpiresAt(expiresAt);
        connection.setUpdatedAt(now);

        return connectionRepository.save(connection);
    }

    @Transactional(readOnly = true)
    public GmailConnection getConnectionForUser(String userEmail) {
        return connectionRepository.findFirstByUser_EmailOrderByUpdatedAtDesc(normalizeEmail(userEmail))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Gmail is not connected for this user"
                ));
    }

    public GmailConnection refreshAccessTokenIfNeeded(GmailConnection connection) {
        if (connection.getExpiresAt() == null
                || connection.getExpiresAt().isAfter(LocalDateTime.now().plusMinutes(2))) {
            return connection;
        }

        if (connection.getRefreshToken() == null || connection.getRefreshToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gmail refresh token is missing; reconnect Gmail");
        }

        validateOAuthConfiguration();

        try {
            GoogleTokenResponse tokenResponse = new GoogleRefreshTokenRequest(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance(),
                    connection.getRefreshToken(),
                    properties.getClientId(),
                    properties.getClientSecret()
            ).execute();

            connection.setAccessToken(tokenResponse.getAccessToken());

            if (tokenResponse.getExpiresInSeconds() != null) {
                connection.setExpiresAt(LocalDateTime.now().plusSeconds(tokenResponse.getExpiresInSeconds()));
            }

            connection.setUpdatedAt(LocalDateTime.now());
            return connectionRepository.save(connection);
        } catch (IOException | GeneralSecurityException exception) {
            log.warn("Gmail token refresh failed");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not refresh Gmail access token");
        }
    }

    public String fetchGmailAddress(String accessToken) {
        try {
            Gmail gmail = GmailClientFactory.build(accessToken);
            Profile profile = gmail.users().getProfile("me").execute();
            String email = profile.getEmailAddress();

            if (email == null || email.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not read Gmail profile email");
            }

            return email;
        } catch (IOException exception) {
            log.warn("Gmail profile lookup failed");
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Could not read Gmail profile");
        }
    }

    private void validateOAuthConfiguration() {
        if (properties.getClientId() == null || properties.getClientId().isBlank()
                || properties.getClientSecret() == null || properties.getClientSecret().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Gmail OAuth is not configured");
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
