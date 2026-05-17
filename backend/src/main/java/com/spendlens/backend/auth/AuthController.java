package com.spendlens.backend.auth;

import com.spendlens.backend.dashboard.CategoryBreakdownResponse;
import com.spendlens.backend.dashboard.DashboardService;
import com.spendlens.backend.dashboard.DashboardSummaryResponse;
import com.spendlens.backend.transactions.CreateTransactionRequest;
import com.spendlens.backend.transactions.TransactionResponse;
import com.spendlens.backend.transactions.TransactionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String DEV_EMAIL = "juano@test.com";

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
    public MeResponse me() {
        return authService.me(DEV_EMAIL);
    }

    @GetMapping("/expenses")
    public List<TransactionResponse> findAllExpenses() {
        return transactionService.findAll(DEV_EMAIL);
    }

    @PostMapping("/expenses")
    public TransactionResponse createExpense(
            @Valid @RequestBody CreateTransactionRequest request
    ) {
        return transactionService.create(request, DEV_EMAIL);
    }

    @GetMapping("/dashboard/summary")
    public DashboardSummaryResponse getDashboardSummary() {
        return dashboardService.getDashboardSummary(DEV_EMAIL);
    }

    @GetMapping("/dashboard/category-breakdown")
    public List<CategoryBreakdownResponse> getCategoryBreakdown() {
        return dashboardService.getCategoryBreakdown(DEV_EMAIL);
    }

    @GetMapping("/dashboard/recent-expenses")
    public List<TransactionResponse> getRecentExpenses() {
        return dashboardService.getRecentExpenses(DEV_EMAIL);
    }
}