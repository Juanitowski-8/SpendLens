package com.spendlens.backend.gmail;

import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Distinguishes completed purchase / receipt emails from news, marketing and price announcements.
 */
@Component
public class GmailPurchaseClassifier {

    private static final String[] STRONG_PURCHASE_SIGNALS = {
            "recibo",
            "receipt",
            "e-receipt",
            "factura",
            "factura electrónica",
            "invoice",
            "comprobante",
            "comprobante de pago",
            "order confirmation",
            "confirmación de pedido",
            "confirmación de compra",
            "purchase confirmation",
            "your order",
            "tu pedido",
            "tu compra",
            "your purchase",
            "gracias por tu compra",
            "thank you for your purchase",
            "thanks for your order",
            "thanks for riding",
            "gracias por viajar",
            "pago exitoso",
            "payment successful",
            "payment received",
            "payment confirmed",
            "payment complete",
            "transaction approved",
            "transacción aprobada",
            "cobro realizado",
            "cargo a tu",
            "charged to your",
            "has been charged",
            "se cargó a",
            "total pagado",
            "amount paid",
            "valor pagado",
            "order total",
            "total de tu pedido"
    };

    private static final String[] NON_PURCHASE_SIGNALS = {
            "newsletter",
            "noticias",
            "breaking news",
            "daily digest",
            "weekly digest",
            "read more",
            "leer más",
            "view in browser",
            "ver en el navegador",
            "unsubscribe",
            "darse de baja",
            "now costs",
            "now cost",
            "ahora cuesta",
            "ahora cuestan",
            "will cost",
            "va a costar",
            "costará",
            "price alert",
            "alerta de precio",
            "stock alert",
            "market update",
            "market cap",
            "tipo de cambio",
            "exchange rate",
            "interest rate",
            "tasa de interés",
            "inflation",
            "inflación",
            "forecast",
            "pronóstico",
            "pronostico",
            "estimated price",
            "precio estimado",
            "starting at",
            "desde $",
            "as low as",
            "hasta $",
            "save up to",
            "ahorra hasta",
            "% off",
            "por ciento de descuento",
            "limited time",
            "tiempo limitado",
            "don't miss",
            "no te pierdas",
            "click here",
            "haz clic aquí",
            "learn more",
            "saber más",
            "free trial",
            "prueba gratis",
            "your cart is waiting",
            "tu carrito te espera",
            "complete your purchase",
            "finaliza tu compra",
            "items left in cart",
            "artículos en tu carrito",
            "payment due",
            "pago pendiente",
            "amount due",
            "monto pendiente",
            "overdue",
            "vencido",
            "recordatorio de pago",
            "bill reminder",
            "verify your email",
            "verifica tu correo",
            "security alert",
            "alerta de seguridad",
            "new arrivals",
            "novedades",
            "just announced",
            "recién anunciado",
            "introducing",
            "presentamos",
            "black friday preview",
            "cyber monday",
            "oferta del día",
            "deal of the day"
    };

    private static final String[] NEWS_SENDER_HINTS = {
            "@news.",
            "newsletter",
            "noreply@news",
            "breaking",
            "digest",
            "marketing",
            "promo@",
            "promotions@"
    };

    public boolean looksLikeCompletedPurchase(String subject, String snippet, String from) {
        String haystack = buildHaystack(subject, snippet, from);

        if (haystack.isBlank()) {
            return false;
        }

        if (matchesAny(haystack, NON_PURCHASE_SIGNALS)) {
            return false;
        }

        if (looksLikeNewsSender(from) && !matchesAny(haystack, STRONG_PURCHASE_SIGNALS)) {
            return false;
        }

        return matchesAny(haystack, STRONG_PURCHASE_SIGNALS);
    }

    public boolean isNonPurchaseContent(String subject, String snippet, String from) {
        return !looksLikeCompletedPurchase(subject, snippet, from);
    }

    private boolean looksLikeNewsSender(String from) {
        String fromLower = safe(from).toLowerCase(Locale.ROOT);
        if (fromLower.isBlank()) {
            return false;
        }
        for (String hint : NEWS_SENDER_HINTS) {
            if (fromLower.contains(hint)) {
                return true;
            }
        }
        return false;
    }

    private boolean matchesAny(String haystack, String[] keywords) {
        for (String keyword : keywords) {
            if (haystack.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String buildHaystack(String... parts) {
        return (" " + String.join(" ", parts) + " ").toLowerCase(Locale.ROOT);
    }

    private String safe(String value) {
        return value == null ? "" : value.trim();
    }
}
