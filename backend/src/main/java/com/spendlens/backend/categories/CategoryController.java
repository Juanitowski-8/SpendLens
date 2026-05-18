package com.spendlens.backend.categories;

import com.spendlens.backend.transactions.CreateTransactionRequest;
import com.spendlens.backend.transactions.TransactionResponse;
import com.spendlens.backend.transactions.TransactionService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;
    private final TransactionService transactionService;

    public CategoryController(
            CategoryService categoryService,
            TransactionService transactionService
    ) {
        this.categoryService = categoryService;
        this.transactionService = transactionService;
    }

    @GetMapping
    public List<CategoryResponse> findAll(Authentication authentication) {
        return categoryService.findAll(authentication.getName());
    }

    @GetMapping("/{id}")
    public CategoryResponse findById(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        return categoryService.findById(id, authentication.getName());
    }

    @PostMapping
    public CategoryResponse create(
            @Valid @RequestBody CreateCategoryRequest request,
            Authentication authentication
    ) {
        return categoryService.create(request, authentication.getName());
    }

    @PutMapping("/{id}")
    public CategoryResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCategoryRequest request,
            Authentication authentication
    ) {
        return categoryService.update(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        categoryService.delete(id, authentication.getName());
    }

    @GetMapping("/expenses")
    public List<TransactionResponse> findAllExpenses(Authentication authentication) {
        return transactionService.findAll(authentication.getName(), null, null);
    }

    @PostMapping("/expenses")
    public TransactionResponse createExpense(
            @Valid @RequestBody CreateTransactionRequest request,
            Authentication authentication
    ) {
        return transactionService.create(request, authentication.getName());
    }
}