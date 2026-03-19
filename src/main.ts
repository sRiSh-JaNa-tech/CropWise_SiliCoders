// PWA Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => console.log('SW registered!', reg))
      .catch(err => console.log('SW failed!', err));
  });
}

// Health Check Logic
const checkHealthBtn = document.getElementById('check-health');
const healthStatus = document.getElementById('health-status');
const statusText = document.getElementById('status-text');
const statusIndicator = document.querySelector('.status-indicator');

checkHealthBtn?.addEventListener('click', async () => {
  healthStatus!.style.display = 'flex';
  statusText!.innerText = 'Checking server status...';
  statusIndicator!.classList.remove('online');

  try {
    const response = await fetch('http://localhost:5000/health');
    const data = await response.json();
    
    if (data.status === 'OK') {
      statusText!.innerText = `Server Status: ${data.message}`;
      statusIndicator!.classList.add('online');
    } else {
      statusText!.innerText = 'Server Status: Error';
    }
  } catch (error) {
    statusText!.innerText = 'Server Status: Offline (Is the backend running?)';
  }
});

// PWA Install Prompt
let deferredPrompt: any;
const installBtn = document.getElementById('install-pwa');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = 'block';
});

installBtn?.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    deferredPrompt = null;
    installBtn.style.display = 'none';
  }
});
