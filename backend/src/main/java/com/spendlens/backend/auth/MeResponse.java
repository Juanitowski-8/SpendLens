package com.spendlens.backend.auth;

import java.util.UUID;

public class MeResponse {

    private UUID id;
    private String name;
    private String email;

    public MeResponse(UUID id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }
}