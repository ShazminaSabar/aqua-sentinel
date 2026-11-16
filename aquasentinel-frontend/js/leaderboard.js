const API_BASE_URL = 'http://localhost:8081/api';

window.onload = async function() {
    const tbody = document.getElementById('leaderboard-body');

    try {
        const response = await fetch(`${API_BASE_URL}/leaderboard`);
        if (response.ok) {
            const players = await response.json();

            if (players.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #8ab4f8;">No mission records found.</td></tr>`;
                return;
            }

            tbody.innerHTML = '';
            players.forEach((player, index) => {
                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid rgba(0, 229, 255, 0.1)';
                row.innerHTML = `
                    <td style="padding: 14px 12px; font-family: 'Orbitron', sans-serif; color: #00ffaa;">#${index + 1}</td>
                    <td style="padding: 14px 12px; font-weight: bold; color: #ffffff;">${player.username}</td>
                    <td style="padding: 14px 12px; text-align: center; font-family: 'Orbitron', sans-serif; color: #00e5ff;">${player.bestCombo || 0}</td>
                    <td style="padding: 14px 12px; text-align: right; font-family: 'Orbitron', sans-serif; color: #00ffaa;">${player.highestScore || 0}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #ff6b6b;">Failed to load leaderboard feed.</td></tr>`;
        }
    } catch (err) {
        console.error("Error fetching leaderboard:", err);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #ff6b6b;">Backend offline or unreachable.</td></tr>`;
    }
};