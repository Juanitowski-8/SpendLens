package com.spendlens.backend.categories;

import com.spendlens.backend.users.User;
import com.spendlens.backend.users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public CategoryService(
            CategoryRepository categoryRepository,
            UserRepository userRepository
    ) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    public List<CategoryResponse> findAll(String email) {
        return categoryRepository.findByUserEmailOrderByNameAsc(normalizeEmail(email))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CategoryResponse findById(UUID id, String email) {
        Category category = categoryRepository.findByIdAndUserEmail(id, normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        return toResponse(category);
    }

    public CategoryResponse create(CreateCategoryRequest request, String email) {
        String normalizedEmail = normalizeEmail(email);
        String name = request.getName().trim();

        if (categoryRepository.existsByNameIgnoreCaseAndUserEmail(name, normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category already exists");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        LocalDateTime now = LocalDateTime.now();

        Category category = new Category(
                UUID.randomUUID(),
                user,
                name,
                cleanColor(request.getColor()),
                now,
                now
        );

        return toResponse(categoryRepository.save(category));
    }

    public CategoryResponse update(UUID id, UpdateCategoryRequest request, String email) {
        String normalizedEmail = normalizeEmail(email);
        Category category = categoryRepository.findByIdAndUserEmail(id, normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        String name = request.getName().trim();

        if (!category.getName().equalsIgnoreCase(name)
                && categoryRepository.existsByNameIgnoreCaseAndUserEmail(name, normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category already exists");
        }

        category.setName(name);
        category.setColor(cleanColor(request.getColor()));
        category.setUpdatedAt(LocalDateTime.now());

        return toResponse(categoryRepository.save(category));
    }

    public void delete(UUID id, String email) {
        Category category = categoryRepository.findByIdAndUserEmail(id, normalizeEmail(email))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));

        categoryRepository.delete(category);
    }

    public Category getOrCreateByName(String email, String categoryName) {
        String normalizedEmail = normalizeEmail(email);
        String name = categoryName.trim();

        if (name.isBlank()) {
            return null;
        }

        return categoryRepository.findByNameIgnoreCaseAndUserEmail(name, normalizedEmail)
                .orElseGet(() -> {
                    User user = userRepository.findByEmail(normalizedEmail)
                            .orElseThrow(() -> new ResponseStatusException(
                                    HttpStatus.NOT_FOUND,
                                    "User not found"));

                    LocalDateTime now = LocalDateTime.now();
                    Category category = new Category(
                            UUID.randomUUID(),
                            user,
                            name,
                            null,
                            now,
                            now
                    );

                    return categoryRepository.save(category);
                });
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getColor(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String cleanColor(String color) {
        if (color == null || color.isBlank()) {
            return null;
        }

        return color.trim();
    }
}