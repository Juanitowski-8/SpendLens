package com.spendlens.backend.gmail;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Month;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class GmailReceiptParser {

    private static final int CONTEXT_WINDOW = 48;

    private static final String[] PRIORITY_AMOUNT_KEYWORDS = {
            "valor total", "valor pagado", "total pagado", "payment total", "amount paid",
            "total paid", "charged", "charge", "order total", "pagaste", "total:", "total ",
            "monto", "pago", "compra", "cobro"
    };

    private static final String[] IGNORE_AMOUNT_KEYWORDS = {
            "nit", "factura", "referencia", "autorización", "autorizacion", "cufe", " id ",
            "transacción", "transaccion", "comprobante", "código", "codigo", "order number",
            "invoice number", "tracking", "phone", "tel", "zip", "postal"
    };

    private static final Pattern AMOUNT_TOKEN = Pattern.compile(
            "(?:USD|US\\$|U\\$S|CAD|CA\\$|EUR|€|GBP|£|COP|COL\\$|\\$)?\\s*(\\d{1,3}(?:\\.\\d{3})+|\\d+(?:[.,]\\d{1,2})?)",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern ISO_DATE_PATTERN = Pattern.compile("\\b(\\d{4})-(\\d{2})-(\\d{2})\\b");
    private static final Pattern SLASH_DATE_PATTERN = Pattern.compile("\\b(\\d{1,2})[/-](\\d{1,2})[/-](\\d{4})\\b");
    private static final Pattern LONG_DATE_PATTERN = Pattern.compile(
            "\\b(\\d{1,2})\\s+de\\s+([a-záéíóú]+)\\s+de\\s+(\\d{4})\\b|\\b(\\d{1,2})\\s+([a-záéíóú]+)\\s+(\\d{4})\\b",
            Pattern.CASE_INSENSITIVE
    );

    private final GmailPromotionalFilter promotionalFilter;
    private final GmailPurchaseClassifier purchaseClassifier;
    private final GmailAmountValidator amountValidator;
    private final GmailMerchantNormalizer merchantNormalizer;
    private final GmailFxConverter fxConverter;

    public GmailReceiptParser(
            GmailPromotionalFilter promotionalFilter,
            GmailPurchaseClassifier purchaseClassifier,
            GmailAmountValidator amountValidator,
            GmailMerchantNormalizer merchantNormalizer,
            GmailFxConverter fxConverter
    ) {
        this.promotionalFilter = promotionalFilter;
        this.purchaseClassifier = purchaseClassifier;
        this.amountValidator = amountValidator;
        this.merchantNormalizer = merchantNormalizer;
        this.fxConverter = fxConverter;
    }

    public Optional<ParsedGmailReceipt> parse(
            String subject,
            String snippet,
            String from,
            String dateHeader,
            Long internalDateMillis
    ) {
        if (promotionalFilter.isPromotionalEmail(subject, snippet, from)) {
            return Optional.empty();
        }

        if (!purchaseClassifier.looksLikeCompletedPurchase(subject, snippet, from)) {
            return Optional.empty();
        }

        String combined = String.join("\n", safe(subject), safe(snippet), safe(from)).trim();
        if (combined.isBlank()) {
            return Optional.empty();
        }

        Optional<ConvertedCandidate> converted = extractBestConvertedAmount(combined, subject, snippet);
        if (converted.isEmpty()) {
            return Optional.empty();
        }

        String merchant = merchantNormalizer.normalize(extractMerchant(combined, from));
        if (merchant.isBlank() || promotionalFilter.isPromotionalMerchantOrDescription(merchant, combined)) {
            return Optional.empty();
        }

        ConvertedCandidate candidate = converted.get();
        if (!amountValidator.isReasonableAmount(
                candidate.amountCop(),
                "COP",
                merchant,
                subject,
                snippet
        )) {
            return Optional.empty();
        }

        LocalDate transactionDate = extractDate(combined, dateHeader, internalDateMillis);

        String baseDescription = truncate("Gmail: " + safe(subject) + " — " + safe(snippet), 420);
        String description = baseDescription + candidate.conversionNote();

        return Optional.of(new ParsedGmailReceipt(
                merchant,
                candidate.amountCop(),
                "COP",
                transactionDate,
                truncate(description, 500)
        ));
    }

    private Optional<ConvertedCandidate> extractBestConvertedAmount(String text, String subject, String snippet) {
        List<ScoredCandidate> candidates = new ArrayList<>();
        Matcher matcher = AMOUNT_TOKEN.matcher(text);

        while (matcher.find()) {
            String rawToken = matcher.group(1);
            if (rawToken == null || rawToken.isBlank() || isNearIgnoreKeyword(text, matcher.start(), matcher.end())) {
                continue;
            }

            BigDecimal rawAmount = parseAmount(rawToken);
            if (rawAmount.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            int windowStart = Math.max(0, matcher.start() - CONTEXT_WINDOW);
            int windowEnd = Math.min(text.length(), matcher.end() + CONTEXT_WINDOW);
            String window = text.substring(windowStart, windowEnd);
            String detectedCurrency = fxConverter.detectCurrencyFromText(window + " " + matcher.group());

            Optional<GmailFxConverter.ConvertedAmount> converted = fxConverter.convertToCop(rawAmount, detectedCurrency);
            if (converted.isEmpty()) {
                continue;
            }

            GmailFxConverter.ConvertedAmount amount = converted.get();
            if (!amountValidator.isReasonableAmount(amount.amountCop(), "COP", "", subject, snippet)) {
                continue;
            }

            int score = priorityScore(text, matcher.start(), matcher.end());
            candidates.add(new ScoredCandidate(
                    amount.amountCop(),
                    amount.conversionNote(),
                    score,
                    matcher.start()
            ));
        }

        Optional<ConvertedCandidate> best = candidates.stream()
                .max(Comparator
                        .comparingInt(ScoredCandidate::score)
                        .thenComparing(ScoredCandidate::amountCop)
                        .thenComparing(ScoredCandidate::position, Comparator.reverseOrder()))
                .map(c -> new ConvertedCandidate(c.amountCop(), c.conversionNote()));

        if (best.isPresent() && candidates.stream().mapToInt(ScoredCandidate::score).max().orElse(0) < 10) {
            String haystack = buildAmountHaystack(subject, snippet);
            boolean hasAmountContext = haystack.contains("total pagado")
                    || haystack.contains("valor pagado")
                    || haystack.contains("amount paid")
                    || haystack.contains("order total")
                    || haystack.contains("charged");
            if (!hasAmountContext) {
                return Optional.empty();
            }
        }

        return best;
    }

    private String buildAmountHaystack(String subject, String snippet) {
        return (" " + safe(subject) + " " + safe(snippet) + " ").toLowerCase(Locale.ROOT);
    }

    private String extractMerchant(String text, String from) {
        String lower = text.toLowerCase(Locale.ROOT);

        if (lower.contains("uber")) return "Uber";
        if (lower.contains("netflix")) return "Netflix";
        if (lower.contains("rappi")) return "Rappi";
        if (lower.contains("exito") || lower.contains("éxito")) return "Éxito";
        if (lower.contains("spotify")) return "Spotify";
        if (lower.contains("best buy")) return "Best Buy";
        if (lower.contains("bath & body") || lower.contains("bath and body")) return "Bath & Body Works";

        if (from != null && !from.isBlank()) {
            Matcher fromMatcher = Pattern.compile("^\\s*([^<]+)").matcher(from.trim());
            if (fromMatcher.find()) {
                String name = fromMatcher.group(1).replace("\"", "").trim();
                if (!name.isBlank() && !name.contains("@") && !name.toLowerCase(Locale.ROOT).contains("no-reply")) {
                    return truncate(name, 180);
                }
            }
            Matcher emailMatcher = Pattern.compile("([\\p{L}0-9._-]+)@").matcher(from);
            if (emailMatcher.find()) {
                return truncate(emailMatcher.group(1), 180);
            }
        }

        Pattern merchantPattern = Pattern.compile(
                "(?i)(?:recibo de|compra en|pago a|comercio:)\\s+([\\p{L}\\p{N}\\s&'.-]+)"
        );
        Matcher matcher = merchantPattern.matcher(text);
        if (matcher.find()) {
            return truncate(matcher.group(1).trim(), 180);
        }

        return "Comercio Gmail";
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
        if (window.contains("cop")) {
            score += 5;
        }
        return score;
    }

    private boolean isNearIgnoreKeyword(String text, int matchStart, int matchEnd) {
        int windowStart = Math.max(0, matchStart - CONTEXT_WINDOW);
        int windowEnd = Math.min(text.length(), matchEnd + CONTEXT_WINDOW);
        String window = (" " + text.substring(windowStart, windowEnd) + " ").toLowerCase(Locale.ROOT);

        for (String keyword : IGNORE_AMOUNT_KEYWORDS) {
            if (window.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private BigDecimal parseAmount(String rawAmount) {
        String cleanedAmount = rawAmount.trim();

        if (cleanedAmount.matches("\\d{1,3}(\\.\\d{3})+")) {
            return new BigDecimal(cleanedAmount.replace(".", ""));
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

    private LocalDate extractDate(String text, String dateHeader, Long internalDateMillis) {
        LocalDate parsed = parseDateFromText(text);
        if (parsed != null) {
            return parsed;
        }
        LocalDate parsedFromHeader = parseDateFromHeader(dateHeader);
        if (parsedFromHeader != null) {
            return parsedFromHeader;
        }
        if (internalDateMillis != null) {
            return Instant.ofEpochMilli(internalDateMillis).atZone(ZoneId.systemDefault()).toLocalDate();
        }
        return LocalDate.now();
    }

    private LocalDate parseDateFromHeader(String dateHeader) {
        if (dateHeader == null || dateHeader.isBlank()) {
            return null;
        }
        try {
            return ZonedDateTime.parse(dateHeader.trim(), DateTimeFormatter.RFC_1123_DATE_TIME).toLocalDate();
        } catch (DateTimeParseException ignored) {
            return null;
        }
    }

    private LocalDate parseDateFromText(String text) {
        Matcher isoMatcher = ISO_DATE_PATTERN.matcher(text);
        if (isoMatcher.find()) {
            try {
                int year = Integer.parseInt(isoMatcher.group(1));
                int month = Integer.parseInt(isoMatcher.group(2));
                int day = Integer.parseInt(isoMatcher.group(3));
                return LocalDate.of(year, month, day);
            } catch (RuntimeException ignored) {
                // continue with other patterns
            }
        }

        Matcher slashMatcher = SLASH_DATE_PATTERN.matcher(text);
        if (slashMatcher.find()) {
            try {
                int day = Integer.parseInt(slashMatcher.group(1));
                int month = Integer.parseInt(slashMatcher.group(2));
                int year = Integer.parseInt(slashMatcher.group(3));
                return LocalDate.of(year, month, day);
            } catch (RuntimeException ignored) {
                // continue with other patterns
            }
        }

        Matcher longMatcher = LONG_DATE_PATTERN.matcher(text.toLowerCase(Locale.ROOT));
        if (longMatcher.find()) {
            String dayToken = longMatcher.group(1) != null ? longMatcher.group(1) : longMatcher.group(4);
            String monthToken = longMatcher.group(2) != null ? longMatcher.group(2) : longMatcher.group(5);
            String yearToken = longMatcher.group(3) != null ? longMatcher.group(3) : longMatcher.group(6);
            try {
                int day = Integer.parseInt(dayToken);
                int year = Integer.parseInt(yearToken);
                Month month = monthFromSpanish(monthToken);
                return LocalDate.of(year, month, day);
            } catch (RuntimeException ignored) {
                // no-op
            }
        }

        return null;
    }

    private Month monthFromSpanish(String token) {
        String month = token.replace("á", "a").replace("é", "e").replace("í", "i")
                .replace("ó", "o").replace("ú", "u").trim().toLowerCase(Locale.ROOT);
        return switch (month) {
            case "enero" -> Month.JANUARY;
            case "febrero" -> Month.FEBRUARY;
            case "marzo" -> Month.MARCH;
            case "abril" -> Month.APRIL;
            case "mayo" -> Month.MAY;
            case "junio" -> Month.JUNE;
            case "julio" -> Month.JULY;
            case "agosto" -> Month.AUGUST;
            case "septiembre", "setiembre" -> Month.SEPTEMBER;
            case "octubre" -> Month.OCTOBER;
            case "noviembre" -> Month.NOVEMBER;
            case "diciembre" -> Month.DECEMBER;
            default -> throw new IllegalArgumentException("Mes no reconocido: " + token);
        };
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

    private record ScoredCandidate(BigDecimal amountCop, String conversionNote, int score, int position) {
    }

    private record ConvertedCandidate(BigDecimal amountCop, String conversionNote) {
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
