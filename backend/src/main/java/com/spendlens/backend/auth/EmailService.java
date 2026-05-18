package com.spendlens.backend.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final String appPublicUrl;
    private final String mailFrom;
    private final boolean mailEnabled;
    private final boolean logResetInDev;
    private final boolean localProfile;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    public EmailService(
            @Value("${app.public-url:${FRONTEND_URL:http://localhost:5173}}") String appPublicUrl,
            @Value("${app.mail.from:${MAIL_FROM:no-reply@spendlens.app}}") String mailFrom,
            @Value("${app.mail.enabled:false}") boolean mailEnabled,
            @Value("${app.mail.log-reset-in-dev:true}") boolean logResetInDev,
            Environment environment,
            ObjectProvider<JavaMailSender> mailSenderProvider
    ) {
        this.appPublicUrl = appPublicUrl;
        this.mailFrom = mailFrom;
        this.mailEnabled = mailEnabled;
        this.logResetInDev = logResetInDev;
        this.localProfile = Arrays.asList(environment.getActiveProfiles()).contains("local");
        this.mailSenderProvider = mailSenderProvider;
    }

    public void sendPasswordResetEmail(String email, String token) {
        String resetUrl = appPublicUrl.replaceAll("/$", "") + "?resetToken=" + token;

        if (mailEnabled && mailSenderProvider.getIfAvailable() != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(mailFrom);
                message.setTo(email);
                message.setSubject("Recupera tu contraseña en SpendLens");
                message.setText(buildResetBody(resetUrl));
                mailSenderProvider.getObject().send(message);
                log.info("Password reset email sent");
                return;
            } catch (Exception exception) {
                log.error("No se pudo enviar el correo de recuperación", exception);
            }
        }

        if (localProfile || logResetInDev) {
            log.info("Password reset link (desarrollo): {}", resetUrl);
            return;
        }

        log.warn(
                "Correo de recuperación no enviado. Activa MAIL_ENABLED=true y configura spring.mail.* (SMTP).");
    }

    private String buildResetBody(String resetUrl) {
        return """
                Hola,

                Recibimos una solicitud para restablecer tu contraseña en SpendLens.

                Abre este enlace (válido 30 minutos):
                %s

                Si no solicitaste el cambio, ignora este mensaje.

                — SpendLens
                """.formatted(resetUrl);
    }
}
