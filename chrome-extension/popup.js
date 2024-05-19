document.addEventListener('DOMContentLoaded', () => {
    var chatInput = document.getElementById('user-input');
    // var cartButton = document.getElementById('cart-button');
    chatInput.focus();

    const chatLog = document.getElementById('chat-log');
    const conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];

    // Function to update the chat log
    function updateChatLog() {
        chatLog.innerHTML = ''; // Clear the existing chat log
        conversationHistory.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.role}`;
            if (message.role === 'assistant' && message.content.includes('<a href="')) {
                messageDiv.innerHTML = message.content; // Set innerHTML to preserve the HTML when reopening the chat
            } else {
                messageDiv.textContent = message.content; // Set textContent for other messages
            }
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
            You also know all of the query parameters that correspond to the Amazon filters in the sidebar.
            If the user asks, take them to their cart at https://www.amazon.com/gp/cart/view.html?ref_=nav_cart.
            
            
            Edge cases:
1. **No Automatic Redirection**: If you notice that the user is not being redirected automatically to Amazon, provide them with a clickable link instead,
   and tell them to go to the Amazon homepage first and ask again.
2. **Ambiguous Input**: If the user's input is ambiguous or incomplete, ask them clarifying questions to ensure you generate the correct Amazon link.
3. **Unavailable Product**: If the specified product is unavailable or cannot be found, suggest similar alternatives available on Amazon.
4. **General Error Handling**: If an error occurs or you cannot fulfill the request, apologize and ask the user to rephrase or provide more details.`

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
                let reply = data.choices[0].message.content.trim();

                // Regular expression to match URLs
                const urlPattern = /https?:\/\/[^\s]+/g;
                reply = reply.replace(urlPattern, url => `<a href="${url}" target="_blank">${url}</a>`);

                // Set the reply as innerHTML to render the links
                botMessage.innerHTML = reply;
                conversationHistory.push({role: 'assistant', content: reply});
                localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));


                // const urlPattern = /https?:\/\/www\.amazon\.com\/[^\s]*/g;
                // const urls = reply.match(urlPattern);
                // if (urls && urls.length > 0) {
                //     const firstUrl = urls[0];
                //     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                //         chrome.scripting.executeScript({
                //             target: { tabId: tabs[0].id },
                //             function: (url) => {
                //                 window.location.href = url;
                //             },
                //             args: [firstUrl]
                //         });
                //     });
                // }

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

    function startListening() {
        document.getElementById('listening-indicator').style.display = 'block';
    }

    function stopListening() {
        document.getElementById('listening-indicator').style.display = 'none';
    }

    document.getElementById('voice-btn').addEventListener('click', async () => {
        const messageDiv = document.getElementById('message');

        try {
            console.log('Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Microphone access granted');
            // messageDiv.textContent = 'Microphone access granted';

            const recognition = new webkitSpeechRecognition();
            recognition.lang = 'en-US';
            // recognition.onstart = () => console.log('Recognition started');
            recognition.onstart = () => startListening();
            recognition.onerror = (event) => console.error('Recognition error:', event);
            // recognition.onresult = (event) => console.log('Recognition result:', event);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                // console.log('Voice input recognized:', transcript);
                document.getElementById('user-input').value = transcript;
                // Automatically send the recognized text as a message
                sendMessage();
            };

            recognition.onend = () => stopListening();


            // recognition.onresult = (event) => {
            //     console.log('Recognition result:', event);

            //     // Extract the recognized speech result
            //     const speechResult = event.results[0][0].transcript;
            //     console.log('Recognized Speech:', speechResult);

            //     // Display the result in the message div
            //     messageDiv.textContent = 'Recognition result: ' + speechResult;
            // };
            recognition.start();
        } catch (err) {
            if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
                messageDiv.textContent = 'Microphone access denied. Please enable it in your browser settings.';
            } else if (err.name === 'PermissionDismissedError') {
                messageDiv.textContent = 'Microphone access dismissed. Please grant permission to use this feature.';
            } else {
                messageDiv.textContent = 'Error accessing the microphone: ' + err.message;
            }
            console.error('Error accessing the microphone', err);
        }
    });

    document.getElementById('open-welcome').addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
    });

    var instructionsButton = document.getElementById('instructions-button');
    var instructionsModal = document.getElementById('instructions-modal');
    var closeButton = document.getElementsByClassName('close')[0];
    var closePopup = document.getElementById('close-popup');

    instructionsButton.onclick = function () {
        instructionsModal.style.display = 'block';
    }

    closeButton.onclick = function () {
        instructionsModal.style.display = 'none';
    }

    closePopup.onclick = function () {
        window.close();
    }

    document.getElementById('cart-button').addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: () => {
                    window.location.href = "https://www.amazon.com/gp/cart/view.html?ref_=nav_cart";
                }
            });
        });
    });

    window.onclick = function (event) {
        if (event.target == instructionsModal) {
            instructionsModal.style.display = 'none';
        }
    }

});

