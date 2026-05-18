package com.spendlens.backend.gmail;

public class GmailAuthorizationUrlResponse {

    private String authorizationUrl;

    public GmailAuthorizationUrlResponse(String authorizationUrl) {
        this.authorizationUrl = authorizationUrl;
    }

    public String getAuthorizationUrl() {
        return authorizationUrl;
    }
}
