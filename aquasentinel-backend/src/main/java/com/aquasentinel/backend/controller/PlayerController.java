package com.aquasentinel.backend.controller;

import com.aquasentinel.backend.model.User;
import com.aquasentinel.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class PlayerController {

    private final UserService userService;

    public PlayerController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/leaderboard")
    public List<User> getLeaderboard() {
        return userService.getLeaderboard();
    }

    @GetMapping("/users/{username}")
    public ResponseEntity<?> getUserProfile(@PathVariable String username) {
        Optional<User> user = userService.findByUsername(username);
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        }
        return ResponseEntity.status(404).body("Player not found");
    }

    @PostMapping("/game/result")
    public ResponseEntity<?> saveGameResult(@RequestBody Map<String, Object> payload) {
        try {
            String username = (String) payload.get("username");
            int score = (int) payload.get("score");
            int combo = (int) payload.get("combo");

            // Fixed: Calls saveGameResult to match your UserService implementation
            User updatedUser = userService.saveGameResult(username, score, combo);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/players/profile")
    public ResponseEntity<?> updateProfile(@RequestParam String username, @RequestBody Map<String, String> updates) {
        try {
            String newUsername = updates.get("newUsername");
            String newPassword = updates.get("newPassword");
            User updatedUser = userService.updateProfile(username, newUsername, newPassword);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}