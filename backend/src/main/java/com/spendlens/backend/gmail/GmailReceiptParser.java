package com.spendlens.backend.gmail;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class GmailReceiptParser {

    static final BigDecimal MAX_REASONABLE_COP_AMOUNT = new BigDecimal("20000000");

    private static final int CONTEXT_WINDOW = 48;

    private static final String[] PRIORITY_AMOUNT_KEYWORDS = {
            "valor total",
            "valor pagado",
            "total pagado",
            "total:",
            "total ",
            "monto",
            "pagaste",
            "pago",
            "compra",
            "cobro",
            "total"
    };

    private static final String[] IGNORE_AMOUNT_KEYWORDS = {
            "nit",
            "factura",
            "referencia",
            "autorización",
            "autorizacion",
            "cufe",
            " id ",
            "transacción",
            "transaccion",
            "comprobante",
            "código",
            "codigo"
    };

    private static final Pattern AMOUNT_TOKEN = Pattern.compile(
            "(?:\\$|COP|USD|EUR)?\\s*(\\d{1,3}(?:\\.\\d{3})+|\\d+(?:[.,]\\d{1,2})?)",
            Pattern.CASE_INSENSITIVE
    );

    public Optional<ParsedGmailReceipt> parse(
            String subject,
            String snippet,
            String from,
            Long internalDateMillis
    ) {
        String combined = String.join(
                "\n",
                safe(subject),
                safe(snippet),
                safe(from)
        ).trim();

        if (combined.isBlank()) {
            return Optional.empty();
        }

        String currency = extractCurrency(combined);
        Optional<BigDecimal> amount = extractAmount(combined, currency);
        if (amount.isEmpty()) {
            return Optional.empty();
        }

        String merchant = extractMerchant(combined, from);
        LocalDate transactionDate = internalDateMillis != null
                ? Instant.ofEpochMilli(internalDateMillis).atZone(ZoneId.systemDefault()).toLocalDate()
                : extractDate(combined);

        String description = truncate("Gmail: " + safe(subject) + " — " + safe(snippet), 500);

        return Optional.of(new ParsedGmailReceipt(merchant, amount.get(), currency, transactionDate, description));
    }

    private String extractMerchant(String text, String from) {
        String lower = text.toLowerCase(Locale.ROOT);

        if (lower.contains("uber")) {
            return "Uber";
        }
        if (lower.contains("netflix")) {
            return "Netflix";
        }
        if (lower.contains("rappi")) {
            return "Rappi";
        }
        if (lower.contains("exito") || lower.contains("éxito")) {
            return "Éxito";
        }
        if (lower.contains("spotify")) {
            return "Spotify";
        }

        if (from != null && !from.isBlank()) {
            Matcher fromMatcher = Pattern.compile("^\\s*([^<]+)").matcher(from.trim());
            if (fromMatcher.find()) {
                String name = fromMatcher.group(1).replace("\"", "").trim();
                if (!name.isBlank() && !name.contains("@")) {
                    return truncate(name, 180);
                }
            }

            Matcher emailMatcher = Pattern.compile("([\\p{L}0-9._-]+)@").matcher(from);
            if (emailMatcher.find()) {
                return truncate(emailMatcher.group(1), 180);
            }
        }

        Pattern merchantPattern = Pattern.compile(
                "(?i)(?:recibo de|compra en|pago a|comercio:)\\s+([\\p{L}\\p{N}\\s]+)"
        );
        Matcher matcher = merchantPattern.matcher(text);
        if (matcher.find()) {
            return truncate(matcher.group(1).trim(), 180);
        }

        return "Comercio Gmail";
    }

    private Optional<BigDecimal> extractAmount(String text, String currency) {
        List<AmountCandidate> candidates = new ArrayList<>();
        Matcher matcher = AMOUNT_TOKEN.matcher(text);

        while (matcher.find()) {
            String rawToken = matcher.group(1);
            if (rawToken == null || rawToken.isBlank()) {
                continue;
            }

            if (isNearIgnoreKeyword(text, matcher.start(), matcher.end())) {
                continue;
            }

            BigDecimal amount = parseAmount(rawToken);
            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            if (!isReasonableAmount(amount, currency)) {
                continue;
            }

            int priorityScore = priorityScore(text, matcher.start(), matcher.end());
            candidates.add(new AmountCandidate(amount, priorityScore, matcher.start()));
        }

        if (candidates.isEmpty()) {
            return Optional.empty();
        }

        return candidates.stream()
                .max(Comparator
                        .comparingInt(AmountCandidate::priorityScore)
                        .thenComparing(AmountCandidate::amount)
                        .thenComparing(AmountCandidate::position, Comparator.reverseOrder()))
                .map(AmountCandidate::amount);
    }

    private int priorityScore(String text, int matchStart, int matchEnd) {
        int windowStart = Math.max(0, matchStart - CONTEXT_WINDOW);
        int windowEnd = Math.min(text.length(), matchEnd + CONTEXT_WINDOW);
        String window = text.substring(windowStart, windowEnd).toLowerCase(Locale.ROOT);

        int score = 0;
        for (String keyword : PRIORITY_AMOUNT_KEYWORDS) {
            if (window.contains(keyword)) {
                score += 10;
            }
        }

        if (window.contains("cop") || window.contains("$")) {
            score += 3;
        }

        return score;
    }

    private boolean isNearIgnoreKeyword(String text, int matchStart, int matchEnd) {
        int windowStart = Math.max(0, matchStart - CONTEXT_WINDOW);
        int windowEnd = Math.min(text.length(), matchEnd + CONTEXT_WINDOW);
        String window = (" " + text.substring(windowStart, windowEnd) + " ").toLowerCase(Locale.ROOT);

        for (String keyword : IGNORE_AMOUNT_KEYWORDS) {
            if (window.contains(" " + keyword.trim() + " ") || window.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    private boolean isReasonableAmount(BigDecimal amount, String currency) {
        if (!"COP".equalsIgnoreCase(currency)) {
            return true;
        }

        return amount.compareTo(MAX_REASONABLE_COP_AMOUNT) <= 0;
    }

    private BigDecimal parseAmount(String rawAmount) {
        String cleanedAmount = rawAmount.trim();

        if (cleanedAmount.matches("\\d{1,3}(\\.\\d{3})+")) {
            cleanedAmount = cleanedAmount.replace(".", "");
            return new BigDecimal(cleanedAmount);
        }

        if (cleanedAmount.contains(",") && cleanedAmount.contains(".")) {
            cleanedAmount = cleanedAmount.replace(".", "").replace(",", ".");
        } else if (cleanedAmount.contains(",")) {
            if (cleanedAmount.matches("\\d+,\\d{1,2}")) {
                cleanedAmount = cleanedAmount.replace(",", ".");
            } else {
                cleanedAmount = cleanedAmount.replace(",", "");
            }
        }

        return new BigDecimal(cleanedAmount);
    }

    private String extractCurrency(String text) {
        String upper = text.toUpperCase(Locale.ROOT);

        if (upper.contains("USD")) {
            return "USD";
        }
        if (upper.contains("EUR")) {
            return "EUR";
        }

        return "COP";
    }

    private LocalDate extractDate(String text) {
        Pattern isoDatePattern = Pattern.compile("(\\d{4}-\\d{2}-\\d{2})");
        Matcher isoMatcher = isoDatePattern.matcher(text);
        if (isoMatcher.find()) {
            return LocalDate.parse(isoMatcher.group(1));
        }

        return LocalDate.now();
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private String truncate(String value, int maxLength) {
        if (value.length() <= maxLength) {
            return value;
        }

        return value.substring(0, maxLength - 1) + "…";
    }

    private record AmountCandidate(BigDecimal amount, int priorityScore, int position) {
    }

    public record ParsedGmailReceipt(
            String merchant,
            BigDecimal amount,
            String currency,
            LocalDate transactionDate,
            String description
    ) {
    }
}
