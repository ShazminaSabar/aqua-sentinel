package com.aquasentinel.backend.controller;

import com.aquasentinel.backend.model.User;
import com.aquasentinel.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
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

    @PostMapping("/game/result")
    public ResponseEntity<?> saveGameResult(@RequestBody Map<String, Object> payload) {
        try {
            String username = (String) payload.get("username");
            int score = payload.containsKey("score") ? (int) payload.get("score") : 0;
            int combo = payload.containsKey("combo") ? (int) payload.get("combo") : 0;

            if (username == null) {
                return ResponseEntity.badRequest().body("Username is required");
            }

            User updatedUser = userService.saveGameResult(username, score, combo);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}