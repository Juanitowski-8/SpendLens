package com.spendlens.backend.gmail;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class GmailCategoryAssigner {

    private static final String UNCATEGORIZED = "Sin categoría";

    private static final Map<String, List<String>> CATEGORY_RULES = buildRules();

    public String assignCategory(String merchant, String subject, String snippet) {
        String haystack = buildHaystack(merchant, subject, snippet);

        for (Map.Entry<String, List<String>> entry : CATEGORY_RULES.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (haystack.contains(keyword.toLowerCase(Locale.ROOT))) {
                    return entry.getKey();
                }
            }
        }

        return UNCATEGORIZED;
    }

    public boolean hasAssignableCategory(String merchant, String subject, String snippet) {
        return !UNCATEGORIZED.equals(assignCategory(merchant, subject, snippet));
    }

    private static Map<String, List<String>> buildRules() {
        Map<String, List<String>> rules = new LinkedHashMap<>();

        rules.put("Transporte", List.of(
                "uber", "cabify", "didi", "beat", "taxis", "lyft"
        ));
        rules.put("Suscripciones", List.of(
                "netflix", "spotify", "disney", "prime video", "amazon prime",
                "youtube", "hbo", "apple music", "google one", "google storage"
        ));
        rules.put("Supermercado", List.of(
                "éxito", "exito", "carulla", "jumbo", "d1", "ara", "olímpica", "olimpica", "walmart"
        ));
        rules.put("Tecnología", List.of(
                "best buy", "apple store", "samsung", "mercado libre", "amazon"
        ));
        rules.put("Ropa", List.of(
                "tommy hilfiger", "nike", "adidas", "zara", "h&m", "the north face"
        ));
        rules.put("Belleza", List.of(
                "bath & body works", "bath and body", "sephora", "falabella beauty"
        ));
        rules.put("Comida", List.of(
                "rappi", "ifood", "uber eats", "mcdonald", "burger king", "starbucks", "juan valdez"
        ));
        rules.put("Salud", List.of(
                "farmatodo", "cruz verde", "droguería", "drogueria"
        ));
        rules.put("Servicios", List.of(
                "claro", "movistar", "tigo", "enel", "acueducto", "gas natural"
        ));

        return rules;
    }

    private String buildHaystack(String merchant, String subject, String snippet) {
        return (safe(merchant) + " " + safe(subject) + " " + safe(snippet)).toLowerCase(Locale.ROOT);
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
