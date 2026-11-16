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

    public User registerUser(User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username is already taken");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public Optional<User> loginUser(String username, String rawPassword) {
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isPresent() && passwordEncoder.matches(rawPassword, user.get().getPassword())) {
            return user;
        }
        return Optional.empty();
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User saveGameResult(String username, int score, int combo) {
        // Robust fallback: Automatically create user if not found in DB during gameplay
        User user = userRepository.findByUsername(username).orElseGet(() -> {
            User newUser = new User(username, passwordEncoder.encode("defaultPassword123"));
            return userRepository.save(newUser);
        });

        user.setGamesPlayed(user.getGamesPlayed() + 1);
        if (score > user.getHighestScore()) {
            user.setHighestScore(score);
        }
        if (combo > user.getBestCombo()) {
            user.setBestCombo(combo);
        }

        return userRepository.save(user);
    }

    public List<User> getLeaderboard() {
        return userRepository.findTop10ByOrderByHighestScoreDesc();
    }

    public User updateProfile(String username, String newUsername, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (newUsername != null && !newUsername.isBlank() && !newUsername.equals(username)) {
            if (userRepository.findByUsername(newUsername).isPresent()) {
                throw new RuntimeException("Username is already taken");
            }
            user.setUsername(newUsername);
        }

        if (newPassword != null && !newPassword.isBlank()) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        return userRepository.save(user);
    }
}