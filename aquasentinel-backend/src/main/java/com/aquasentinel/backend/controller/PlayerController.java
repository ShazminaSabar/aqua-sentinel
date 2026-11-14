package com.aquasentinel.backend.controller;

import com.aquasentinel.backend.model.User;
import com.aquasentinel.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class PlayerController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    public PlayerController(UserService userService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    // GET player profile by username
    @GetMapping("/players/profile")
    public ResponseEntity<?> getProfile(@RequestParam String username) {
        Optional<User> user = userService.findByUsername(username);
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        }
        return ResponseEntity.status(404).body("Player not found");
    }

    // PUT update player profile (Username or Password changes from Account Settings wireframe)
    @PutMapping("/players/profile")
    public ResponseEntity<?> updateProfile(@RequestParam String username, @RequestBody Map<String, String> updates) {
        try {
            String newUsername = updates.get("newUsername");
            String newPassword = updates.get("newPassword");
            User updatedUser = userService.updateProfile(username, newUsername, newPassword, passwordEncoder);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST save game score and stats after gameplay finishes
    @PostMapping("/game/save")
    public ResponseEntity<?> saveGame(@RequestBody Map<String, Object> gameData) {
        try {
            String username = (String) gameData.get("username");
            int score = (int) gameData.get("score");
            int wave = (int) gameData.get("wave");
            int combo = (int) gameData.get("combo");

            User updatedUser = userService.saveGameResult(username, score, wave, combo);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}