/*
  Aqua Sentinel - App Logic & Auth Handling
  Base fetch structure and tab switching built with AI help.
  Custom session handling (localStorage), removing popup alerts,
  and smooth UI view transitions manually written by me.
*/

// Base URL for your Spring Boot backend (matches your port 8081 or 8080)
const API_BASE_URL = 'http://localhost:8081/api';

// Switch between Login and Register tabs
function switchAuthTab(tab) {
    const loginBtn = document.getElementById('tab-login-btn');
    const registerBtn = document.getElementById('tab-register-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorElem = document.getElementById('auth-error');

    if (errorElem) errorElem.innerText = '';

    if (tab === 'login') {
        loginBtn.classList.add('active');
        registerBtn.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        registerBtn.classList.add('active');
        loginBtn.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

// Handle User Login (Transitions directly to menu with no popups)
async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorElem = document.getElementById('auth-error');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const user = await response.json();
            localStorage.setItem('aquaUser', user.username);
            showMainMenu(user.username);
        } else {
            const errText = await response.text();
            errorElem.innerText = errText || 'Invalid username or password';
        }
    } catch (error) {
        console.error('Connection error:', error);
        errorElem.innerText = 'Unable to connect to backend server.';
    }
}

// Handle User Registration (Switches directly to login tab with no alert popup)
async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const errorElem = document.getElementById('auth-error');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            // Seamlessly switch to login tab without any browser pop-up alert
            switchAuthTab('login');
            // Optional: Pre-fill the login username for convenience
            document.getElementById('login-username').value = username;
            document.getElementById('login-password').focus();
        } else {
            const errText = await response.text();
            errorElem.innerText = errText || 'Registration failed';
        }
    } catch (error) {
        console.error('Connection error:', error);
        errorElem.innerText = 'Unable to connect to backend server.';
    }
}

// Transition to Main Menu
function showMainMenu(username) {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('menu-screen').classList.add('active');
    document.getElementById('display-username').innerText = username;
}

// Handle Logout
function handleLogout() {
    localStorage.removeItem('aquaUser');
    document.getElementById('menu-screen').classList.remove('active');
    document.getElementById('auth-screen').classList.add('active');
}

// Check session on page load & initialize tabs properly
window.onload = function() {
    const savedUser = localStorage.getItem('aquaUser');
    if (savedUser) {
        showMainMenu(savedUser);
    } else {
        switchAuthTab('login');
    }
};