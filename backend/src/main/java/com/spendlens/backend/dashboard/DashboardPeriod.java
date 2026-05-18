package com.spendlens.backend.dashboard;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;

public final class DashboardPeriod {

    private DashboardPeriod() {
    }

    public static YearMonth resolve(Integer year, Integer month) {
        if (year == null && month == null) {
            return null;
        }

        if (year == null || month == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Both year and month are required for period filtering"
            );
        }

        if (month < 1 || month > 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Month must be between 1 and 12");
        }

        if (year < 2000 || year > 2100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Year is out of supported range");
        }

        return YearMonth.of(year, month);
    }

    public static LocalDate startDate(YearMonth period) {
        return period.atDay(1);
    }

    public static LocalDate endDate(YearMonth period) {
        return period.atEndOfMonth();
    }
}
