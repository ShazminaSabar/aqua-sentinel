const API_BASE_URL = 'http://localhost:8081/api';

window.onload = async function() {
    const username = localStorage.getItem('aquaUser');
    if (!username) {
        window.location.href = '../index.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/${username}`);
        if (response.ok) {
            const data = await response.json();

            document.getElementById('profile-username').innerText = data.username || username;
            document.getElementById('profile-games').innerText = data.gamesPlayed || 0;
            document.getElementById('profile-highscore').innerText = data.highestScore || 0;
            document.getElementById('profile-combo').innerText = data.bestCombo || 0;
        } else {
            console.error("Failed to load user profile data.");
        }
    } catch (e) {
        console.error('Network error loading profile stats:', e);
    }
};

function logout() {
    localStorage.removeItem('aquaUser');
    window.location.href = '../index.html';
}