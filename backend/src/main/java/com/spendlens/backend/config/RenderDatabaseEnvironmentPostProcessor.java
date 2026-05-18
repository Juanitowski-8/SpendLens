package com.spendlens.backend.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Render PostgreSQL exposes DATABASE_URL as {@code postgres://...}.
 * Spring JDBC expects {@code jdbc:postgresql://...}.
 */
public class RenderDatabaseEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String DATABASE_URL_KEY = "DATABASE_URL";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String databaseUrl = environment.getProperty(DATABASE_URL_KEY);
        if (databaseUrl == null || databaseUrl.isBlank() || databaseUrl.startsWith("jdbc:")) {
            return;
        }

        if (!databaseUrl.startsWith("postgres://") && !databaseUrl.startsWith("postgresql://")) {
            return;
        }

        try {
            URI uri = URI.create(databaseUrl.replace("postgresql://", "postgres://"));
            Map<String, Object> overrides = new HashMap<>();
            overrides.put("spring.datasource.url", toJdbcUrl(uri));

            String userInfo = uri.getUserInfo();
            if (userInfo != null && !userInfo.isBlank()) {
                String[] credentials = userInfo.split(":", 2);
                overrides.put("spring.datasource.username", decode(credentials[0]));
                if (credentials.length > 1) {
                    overrides.put("spring.datasource.password", decode(credentials[1]));
                }
            }
            environment.getPropertySources().addFirst(new MapPropertySource("renderDatabase", overrides));
        } catch (Exception ignored) {
            // Fall back to explicit JDBC env vars if parsing fails.
        }
    }

    private static String toJdbcUrl(URI uri) {
        String host = uri.getHost();
        int port = uri.getPort() > 0 ? uri.getPort() : 5432;
        String path = uri.getPath() == null || uri.getPath().isBlank() ? "" : uri.getPath();
        String query = uri.getQuery() == null || uri.getQuery().isBlank() ? "sslmode=require" : uri.getQuery();

        return "jdbc:postgresql://" + host + ":" + port + path + "?" + query;
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
