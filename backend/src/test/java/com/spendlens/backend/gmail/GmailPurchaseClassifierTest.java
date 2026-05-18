package com.spendlens.backend.gmail;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GmailPurchaseClassifierTest {

    private GmailPurchaseClassifier classifier;

    @BeforeEach
    void setUp() {
        classifier = new GmailPurchaseClassifier();
    }

    @Test
    void acceptsReceiptEmail() {
        assertTrue(classifier.looksLikeCompletedPurchase(
                "Tu recibo de Uber",
                "Total pagado $35.000 COP. Gracias por viajar.",
                "receipts@uber.com"
        ));
    }

    @Test
    void rejectsPriceAnnouncement() {
        assertFalse(classifier.looksLikeCompletedPurchase(
                "Bitcoin now costs $120,000",
                "The price will increase next week according to analysts.",
                "news@crypto.com"
        ));
    }

    @Test
    void rejectsNewsletter() {
        assertFalse(classifier.looksLikeCompletedPurchase(
                "Top deals for you today",
                "Save up to 50% off. Unsubscribe here.",
                "deals@store.com"
        ));
    }

    @Test
    void rejectsPaymentReminder() {
        assertFalse(classifier.looksLikeCompletedPurchase(
                "Payment due for your subscription",
                "Amount due $9.99. Please pay before the due date.",
                "billing@service.com"
        ));
    }

    @Test
    void acceptsOrderConfirmation() {
        assertTrue(classifier.looksLikeCompletedPurchase(
                "Order confirmation #12345",
                "Thank you for your purchase. Order total $214.300",
                "orders@exito.com"
        ));
    }
}
