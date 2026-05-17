package com.spendlens.backend.transactions;

import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/expenses-v2")
public class ExpenseController {

    private final TransactionService transactionService;

    public ExpenseController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public List<TransactionResponse> findAll(Authentication authentication) {
        return transactionService.findAll(authentication.getName());
    }

    @PostMapping
    public TransactionResponse create(
            @Valid @RequestBody CreateTransactionRequest request,
            Authentication authentication
    ) {
        return transactionService.create(request, authentication.getName());
    }

    @GetMapping("/{id}")
    public TransactionResponse findById(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        return transactionService.findById(id, authentication.getName());
    }

    @PutMapping("/{id}")
    public TransactionResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTransactionRequest request,
            Authentication authentication
    ) {
        return transactionService.update(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        transactionService.delete(id, authentication.getName());
    }
}