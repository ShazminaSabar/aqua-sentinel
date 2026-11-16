package com.aquasentinel.backend.controller;

import com.aquasentinel.backend.model.User;
import com.aquasentinel.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@Valid @RequestBody User user) {
        try {
            User savedUser = userService.registerUser(user);
            return ResponseEntity.ok(savedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        Optional<User> user = userService.loginUser(loginRequest.getUsername(), loginRequest.getPassword());
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        }
        return ResponseEntity.status(401).body("Invalid username or password");
    }
}