window.onload = function() {
    const sound = localStorage.getItem('aquaSound') !== 'false';
    const diff = localStorage.getItem('aquaDiff') || 'Normal';
    document.getElementById('sound-toggle').checked = sound;
    document.getElementById('difficulty-select').value = diff;
};

function saveSettings() {
    const sound = document.getElementById('sound-toggle').checked;
    const diff = document.getElementById('difficulty-select').value;
    localStorage.setItem('aquaSound', sound);
    localStorage.setItem('aquaDiff', diff);

    const msg = document.getElementById('save-status');
    msg.innerText = 'CALIBRATION SAVED SUCCESSFULLY';
    setTimeout(() => { msg.innerText = ''; }, 2000);
}