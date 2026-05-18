package com.spendlens.backend.categories;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findByUserEmailOrderByNameAsc(String email);

    Optional<Category> findByIdAndUserEmail(UUID id, String email);

    boolean existsByNameIgnoreCaseAndUserEmail(String name, String email);

    Optional<Category> findByNameIgnoreCaseAndUserEmail(String name, String email);
}