package com.spendlens.backend.auth;

import com.spendlens.backend.dashboard.CategoryBreakdownResponse;
import com.spendlens.backend.dashboard.DashboardService;
import com.spendlens.backend.dashboard.DashboardSummaryResponse;
import com.spendlens.backend.dashboard.AvailablePeriodResponse;
import com.spendlens.backend.transactions.CreateTransactionRequest;
import com.spendlens.backend.transactions.TransactionResponse;
import com.spendlens.backend.transactions.TransactionService;
import com.spendlens.backend.transactions.UpdateTransactionRequest;
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
    private final PasswordResetService passwordResetService;

    public AuthController(
            AuthService authService,
            TransactionService transactionService,
            DashboardService dashboardService,
            PasswordResetService passwordResetService
    ) {
        this.authService = authService;
        this.transactionService = transactionService;
        this.dashboardService = dashboardService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return passwordResetService.requestPasswordReset(request.getEmail());
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
    }

    @GetMapping("/me")
    public MeResponse me(Authentication authentication) {
        return authService.me(getEmail(authentication));
    }

    @GetMapping("/expenses")
    public List<TransactionResponse> findAllExpenses(
            Authentication authentication,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month
    ) {
        return transactionService.findAll(getEmail(authentication), year, month);
    }

    @PostMapping("/expenses")
    public TransactionResponse createExpense(
            Authentication authentication,
            @Valid @RequestBody CreateTransactionRequest request
    ) {
        return transactionService.create(request, getEmail(authentication));
    }

    @PutMapping("/expenses/{id}")
    public TransactionResponse updateExpense(
            @PathVariable UUID id,
            Authentication authentication,
            @Valid @RequestBody UpdateTransactionRequest request
    ) {
        return transactionService.update(id, request, getEmail(authentication));
    }

    @DeleteMapping("/expenses/{id}")
    public void deleteExpense(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        transactionService.delete(id, getEmail(authentication));
    }

    @GetMapping("/dashboard/summary")
    public DashboardSummaryResponse getDashboardSummary(
            Authentication authentication,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month
    ) {
        return dashboardService.getDashboardSummary(getEmail(authentication), year, month);
    }

    @GetMapping("/dashboard/category-breakdown")
    public List<CategoryBreakdownResponse> getCategoryBreakdown(
            Authentication authentication,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month
    ) {
        return dashboardService.getCategoryBreakdown(getEmail(authentication), year, month);
    }

    @GetMapping("/dashboard/recent-expenses")
    public List<TransactionResponse> getRecentExpenses(
            Authentication authentication,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month
    ) {
        return dashboardService.getRecentExpenses(getEmail(authentication), year, month);
    }

    @GetMapping("/dashboard/available-periods")
    public List<AvailablePeriodResponse> getAvailablePeriods(
            Authentication authentication,
            @RequestParam(required = false) Integer limit
    ) {
        return dashboardService.getAvailablePeriods(getEmail(authentication), limit);
    }

    private String getEmail(Authentication authentication) {
        return authentication.getName();
    }
}