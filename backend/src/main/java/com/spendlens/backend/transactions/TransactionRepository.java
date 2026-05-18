package com.spendlens.backend.transactions;

import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    List<Transaction> findByUserEmailOrderByTransactionDateDescCreatedAtDesc(String email);

    List<Transaction> findByUserEmailAndTransactionDateBetweenOrderByTransactionDateDescCreatedAtDesc(
            String email,
            LocalDate startDate,
            LocalDate endDate
    );

    Optional<Transaction> findByIdAndUserEmail(UUID id, String email);

    boolean existsByUser_IdAndMerchantIgnoreCaseAndAmountAndTransactionDate(
            UUID userId,
            String merchant,
            BigDecimal amount,
            LocalDate transactionDate
    );
}