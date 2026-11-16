package com.aquasentinel.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    @NotBlank(message = "Username is required")
    private String username;

    @Column(nullable = false)
    @NotBlank(message = "Password is required")
    private String password;

    @Column(name = "games_played")
    private int gamesPlayed = 0;

    @Column(name = "highest_score")
    private int highestScore = 0;

    @Column(name = "best_combo")
    private int bestCombo = 0;

    public User() {}

    public User(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public int getGamesPlayed() { return gamesPlayed; }
    public void setGamesPlayed(int gamesPlayed) { this.gamesPlayed = gamesPlayed; }

    public int getHighestScore() { return highestScore; }
    public void setHighestScore(int highestScore) { this.highestScore = highestScore; }

    public int getBestCombo() { return bestCombo; }
    public void setBestCombo(int bestCombo) { this.bestCombo = bestCombo; }
}