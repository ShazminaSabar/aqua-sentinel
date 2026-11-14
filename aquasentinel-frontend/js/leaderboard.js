const API_BASE_URL = 'http://localhost:8081/api';

window.onload = async function() {
    const tbody = document.getElementById('leaderboard-body');
    try {
        const response = await fetch(`${API_BASE_URL}/leaderboard`);
        if (response.ok) {
            const leaders = await response.json();
            tbody.innerHTML = '';
            if (leaders.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No mission records found yet.</td></tr>`;
                return;
            }
            leaders.forEach((entry, index) => {
                tbody.innerHTML += `
                    <tr>
                        <td>#${index + 1}</td>
                        <td style="font-weight: bold; color: #00ffaa;">${entry.username}</td>
                        <td>Wave ${entry.highestWave || 1}</td>
                        <td style="font-family: 'Orbitron'; color: #00e5ff;">${entry.highestScore || 0}</td>
                    </tr>
                `;
            });
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ff6b6b;">Unable to connect to fleet server.</td></tr>`;
    }
};