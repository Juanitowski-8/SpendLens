package com.spendlens.backend.gmail;

import com.spendlens.backend.imports.MockReceiptImportResult;
import com.spendlens.backend.users.User;
import com.spendlens.backend.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth/gmail")
public class GmailOAuthController {

    private static final Logger log = LoggerFactory.getLogger(GmailOAuthController.class);

    private final GmailOAuthService gmailOAuthService;
    private final GmailSyncService gmailSyncService;
    private final UserRepository userRepository;
    private final String frontendUrl;

    public GmailOAuthController(
            GmailOAuthService gmailOAuthService,
            GmailSyncService gmailSyncService,
            UserRepository userRepository,
            @Value("${frontend.url:http://localhost:5173}") String frontendUrl
    ) {
        this.gmailOAuthService = gmailOAuthService;
        this.gmailSyncService = gmailSyncService;
        this.userRepository = userRepository;
        this.frontendUrl = frontendUrl;
    }

    /**
     * Authenticated entry point: frontend calls this with JWT, then redirects the browser to Google.
     */
    @GetMapping("/connect-url")
    public GmailAuthorizationUrlResponse connectUrl(Authentication authentication) {
        UUID userId = getUserId(authentication);
        String authorizationUrl = gmailOAuthService.buildAuthorizationUrl(userId);
        return new GmailAuthorizationUrlResponse(authorizationUrl);
    }

    @GetMapping("/callback")
    public void callback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            HttpServletResponse response
    ) throws IOException {
        if (error != null || code == null || state == null) {
            response.sendRedirect(frontendUrl + "?gmail=error");
            return;
        }

        try {
            gmailOAuthService.handleOAuthCallback(code, state);
            response.sendRedirect(frontendUrl + "?gmail=connected");
        } catch (Exception exception) {
            log.warn("Gmail OAuth callback failed");
            response.sendRedirect(frontendUrl + "?gmail=error");
        }
    }

    @PostMapping("/sync")
    public MockReceiptImportResult sync(Authentication authentication) {
        return gmailSyncService.sync(getEmail(authentication));
    }

    private UUID getUserId(Authentication authentication) {
        return getUser(authentication).getId();
    }

    private String getEmail(Authentication authentication) {
        return getUser(authentication).getEmail();
    }

    private User getUser(Authentication authentication) {
        return userRepository.findByEmail(normalizeEmail(authentication.getName()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
