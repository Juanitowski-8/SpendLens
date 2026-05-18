package com.spendlens.backend.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "app.mail.enabled", havingValue = "true")
public class MailConfig {
    // Spring Boot auto-configures JavaMailSender when spring.mail.host is set.
}
