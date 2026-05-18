package com.spendlens.backend.gmail;

import com.google.api.client.auth.oauth2.BearerToken;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.security.GeneralSecurityException;

final class GmailClientFactory {

    private GmailClientFactory() {
    }

    static Gmail build(String accessToken) {
        try {
            Credential credential = new Credential(BearerToken.authorizationHeaderAccessMethod());
            credential.setAccessToken(accessToken);

            return new Gmail.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance(),
                    credential
            )
                    .setApplicationName("SpendLens")
                    .build();
        } catch (IOException | GeneralSecurityException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not initialize Gmail client");
        }
    }
}
