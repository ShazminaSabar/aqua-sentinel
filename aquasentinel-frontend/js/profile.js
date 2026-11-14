const API_BASE_URL = 'http://localhost:8081/api';

window.onload = async function() {
    const username = localStorage.getItem('aquaUser');
    if (!username) {
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('profile-username').innerText = username;

    try {
        const response = await fetch(`${API_BASE_URL}/users/${username}`);
        if (response.ok) {
            const data = await response.json();
            document.getElementById('profile-highscore').innerText = data.highestScore || 0;
            document.getElementById('profile-games').innerText = data.gamesPlayed || 0;
            document.getElementById('profile-wave').innerText = data.highestWave || 0;
        }
    } catch (e) {
        console.error('Failed to load profile stats:', e);
    }
};