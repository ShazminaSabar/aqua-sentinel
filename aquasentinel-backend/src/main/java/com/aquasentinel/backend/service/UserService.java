package com.aquasentinel.backend.service;

import com.aquasentinel.backend.model.User;
import com.aquasentinel.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Register a new user with a securely hashed password
    public User registerUser(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username is already taken!");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    // Authenticate user login by comparing password hashes
    public Optional<User> loginUser(String username, String rawPassword) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent() && passwordEncoder.matches(rawPassword, userOpt.get().getPassword())) {
            return userOpt;
        }
        return Optional.empty();
    }

    // Find user by username for profile viewing
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // Update user profile (Username or Password changes from Account Settings wireframe)
    public User updateProfile(String username, String newUsername, String newPassword, PasswordEncoder passwordEncoder) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (newUsername != null && !newUsername.isBlank() && !newUsername.equals(username)) {
            if (userRepository.existsByUsername(newUsername)) {
                throw new RuntimeException("Username is already taken!");
            }
            user.setUsername(newUsername);
        }

        if (newPassword != null && !newPassword.isBlank()) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        return userRepository.save(user);
    }

    // Save game results and update user personal stats (Score, Wave, Combo)
    public User saveGameResult(String username, int score, int wave, int combo) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setGamesPlayed(user.getGamesPlayed() + 1);
        if (score > user.getHighestScore()) {
            user.setHighestScore(score);
        }
        if (wave > user.getHighestWave()) {
            user.setHighestWave(wave);
        }
        if (combo > user.getBestCombo()) {
            user.setBestCombo(combo);
        }

        return userRepository.save(user);
    }

    // Get top 10 users for the Leaderboard view
    public List<User> getLeaderboard() {
        return userRepository.findAll()
                .stream()
                .sorted((u1, u2) -> Integer.compare(u2.getHighestScore(), u1.getHighestScore()))
                .limit(10)
                .toList();
    }
}