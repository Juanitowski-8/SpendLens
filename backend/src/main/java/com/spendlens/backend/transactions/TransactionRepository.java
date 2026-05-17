package com.spendlens.backend.transactions;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    List<Transaction> findByUserEmailOrderByTransactionDateDescCreatedAtDesc(String email);

    Optional<Transaction> findByIdAndUserEmail(UUID id, String email);
}