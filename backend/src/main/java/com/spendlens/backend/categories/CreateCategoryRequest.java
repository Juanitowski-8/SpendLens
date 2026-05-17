package com.spendlens.backend.categories;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateCategoryRequest {

    @NotBlank
    @Size(max = 120)
    private String name;

    @Size(max = 40)
    private String color;

    public String getName() {
        return name;
    }

    public String getColor() {
        return color;
    }
}