document.getElementById('grant-access').addEventListener('click', async () => {
    const messageDiv = document.getElementById('message');

    try {
        console.log('Requesting microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone access granted');
        messageDiv.textContent = 'Microphone access granted. You can now use the extension’s speech recognition features.';

        // Here, you could send a message to the background script if needed
        chrome.runtime.sendMessage({ type: 'MIC_ACCESS_GRANTED' });

        // Close the welcome page if desired
        window.close();
    } catch (err) {
        if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
            messageDiv.textContent = 'Microphone access denied. Please grant access by opening the Welcome Page.';
        } else if (err.name === 'PermissionDismissedError') {
            messageDiv.textContent = 'Microphone access dismissed. Please grant access by opening the Welcome Page.';
        } else {
            messageDiv.textContent = 'Error accessing the microphone: ' + err.message;
        }
        console.error('Error accessing the microphone', err);
    }
});
