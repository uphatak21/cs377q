document.addEventListener('DOMContentLoaded', () => {
    const chatLog = document.getElementById('chat-log');
    const conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];

    // Function to update the chat log
    function updateChatLog() {
        chatLog.innerHTML = ''; // Clear the existing chat log
        conversationHistory.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.role}`;
            messageDiv.textContent = message.content;
            chatLog.appendChild(messageDiv);
        });
    }

    // Initial update of the chat log on page load
    updateChatLog();

    async function sendMessage() {
        const userInput = document.getElementById('user-input').value;

        if (userInput) {
            const userMessage = document.createElement('div');
            userMessage.className = 'message user';
            userMessage.textContent = userInput;
            chatLog.appendChild(userMessage);

            conversationHistory.push({ role: 'user', content: userInput });
            localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));

            SYSTEM_PROMPT = `"You are ChatGPT, a large language model
            trained by OpenAI, based on the GPT-4o architecture.
            When a user tells you what they want, always produce an Amazon url for that item with the following form: "https://www.amazon.com/".
            The query parameters should go after the slash.
            You also know all of the query parameters that correspond to the Amazon filters in the sidebar.`

            // Send user input to OpenAI API
            const botMessage = document.createElement('div');
            botMessage.className = 'message bot';
            botMessage.textContent = 'Thinking...';
            chatLog.appendChild(botMessage);

            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer sk-proj-jpXBQaHemVKLxypx1WQGT3BlbkFJDrLI6jFQk2xnaHmF1OOy`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o',
                        // messages: conversationHistory.concat({ role: 'user', content: userInput })
                        messages: conversationHistory.concat([
                            { role: 'system', content: SYSTEM_PROMPT },
                            { role: 'user', content: userInput }
                        ])
                    })
                });

                const data = await response.json();
                const reply = data.choices[0].message.content.trim();
                botMessage.textContent = reply;

                conversationHistory.push({ role: 'assistant', content: reply });
                localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));

                const urlPattern = /https?:\/\/www\.amazon\.com\/[^\s]*/g;
                const urls = reply.match(urlPattern);
                if (urls && urls.length > 0) {
                    const firstUrl = urls[0];
                    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                        chrome.scripting.executeScript({
                            target: { tabId: tabs[0].id },
                            function: (url) => {
                                window.location.href = url;
                            },
                            args: [firstUrl]
                        });
                    });
                }

                document.getElementById('user-input').value = '';
            } catch (error) {
                botMessage.textContent = 'Error: ' + error.message;
            }
        }
    }

    document.getElementById('send-btn').addEventListener('click', sendMessage);

    document.getElementById('user-input').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // Event listener for the clear button
    document.getElementById('clear-btn').addEventListener('click', () => {
        localStorage.removeItem('conversationHistory');
        conversationHistory.length = 0; // Clear the array
        updateChatLog(); // Update the chat log to reflect the cleared history
    });
});

