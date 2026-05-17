package com.spendlens.backend.auth;

import com.spendlens.backend.dashboard.CategoryBreakdownResponse;
import com.spendlens.backend.dashboard.DashboardService;
import com.spendlens.backend.dashboard.DashboardSummaryResponse;
import com.spendlens.backend.transactions.CreateTransactionRequest;
import com.spendlens.backend.transactions.TransactionResponse;
import com.spendlens.backend.transactions.TransactionService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final TransactionService transactionService;
    private final DashboardService dashboardService;

    public AuthController(
            AuthService authService,
            TransactionService transactionService,
            DashboardService dashboardService
    ) {
        this.authService = authService;
        this.transactionService = transactionService;
        this.dashboardService = dashboardService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public MeResponse me(Authentication authentication) {
        return authService.me(getEmail(authentication));
    }

    @GetMapping("/expenses")
    public List<TransactionResponse> findAllExpenses(Authentication authentication) {
        return transactionService.findAll(getEmail(authentication));
    }

    @PostMapping("/expenses")
    public TransactionResponse createExpense(
            Authentication authentication,
            @Valid @RequestBody CreateTransactionRequest request
    ) {
        return transactionService.create(request, getEmail(authentication));
    }

    @DeleteMapping("/expenses/{id}")
    public void deleteExpense(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        transactionService.delete(id, getEmail(authentication));
    }

    @GetMapping("/dashboard/summary")
    public DashboardSummaryResponse getDashboardSummary(Authentication authentication) {
        return dashboardService.getDashboardSummary(getEmail(authentication));
    }

    @GetMapping("/dashboard/category-breakdown")
    public List<CategoryBreakdownResponse> getCategoryBreakdown(Authentication authentication) {
        return dashboardService.getCategoryBreakdown(getEmail(authentication));
    }

    @GetMapping("/dashboard/recent-expenses")
    public List<TransactionResponse> getRecentExpenses(Authentication authentication) {
        return dashboardService.getRecentExpenses(getEmail(authentication));
    }

    private String getEmail(Authentication authentication) {
        return authentication.getName();
    }
}