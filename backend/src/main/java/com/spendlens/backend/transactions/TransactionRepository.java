package com.spendlens.backend.transactions;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    boolean existsByUser_IdAndSourceAndMerchantIgnoreCaseAndAmountAndTransactionDate(
            UUID userId,
            TransactionSource source,
            String merchant,
            BigDecimal amount,
            LocalDate transactionDate
    );

    List<Transaction> findByUserEmailAndSource(String email, TransactionSource source);

    @Query(
            value = """
                    SELECT
                      EXTRACT(YEAR FROM t.transaction_date)::int AS year,
                      EXTRACT(MONTH FROM t.transaction_date)::int AS month
                    FROM transactions t
                    JOIN users u ON u.id = t.user_id
                    WHERE LOWER(u.email) = LOWER(:email)
                    GROUP BY 1, 2
                    ORDER BY 1 DESC, 2 DESC
                    LIMIT :limit
                    """,
            nativeQuery = true
    )
    List<TransactionPeriodProjection> findAvailablePeriodsByUserEmail(
            @Param("email") String email,
            @Param("limit") int limit
    );
}