package com.spendlens.backend.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final String appPublicUrl;
    private final boolean devProfile;

    public EmailService(
            @Value("${app.public-url:${FRONTEND_URL:http://localhost:5173}}") String appPublicUrl,
            Environment environment
    ) {
        this.appPublicUrl = appPublicUrl;
        this.devProfile = Arrays.asList(environment.getActiveProfiles()).contains("dev")
                || Arrays.asList(environment.getDefaultProfiles()).isEmpty();
    }

    public void sendPasswordResetEmail(String email, String token) {
        String resetUrl = appPublicUrl.replaceAll("/$", "") + "?resetToken=" + token;

        if (devProfile) {
            log.info("Password reset link generated for account (dev only)");
            log.info("Reset URL: {}", resetUrl);
            return;
        }

        log.info("Password reset requested; configure email provider to deliver reset links");
    }
}
