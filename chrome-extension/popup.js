// document.getElementById('send-btn').addEventListener('click', async () => {
//     const userInput = document.getElementById('user-input').value;
//     const chatLog = document.getElementById('chat-log');

//     if (userInput) {
//         const userMessage = document.createElement('div');
//         userMessage.className = 'message user';
//         userMessage.textContent = userInput;
//         chatLog.appendChild(userMessage);

//         // Send user input to OpenAI API
//         const botMessage = document.createElement('div');
//         botMessage.className = 'message bot';
//         botMessage.textContent = 'Thinking...';
//         chatLog.appendChild(botMessage);

// SYSTEM_PROMPT = `"You are ChatGPT, a large language model
// trained by OpenAI, based on the GPT-4o architecture.
// When a user tells you what they want, always produce an Amazon url for that item with the following form: "https://www.amazon.com/".
// The query parameters should go after the slash.
// You also know all of the query parameters that correspond to the Amazon filters in the sidebar.`

//         const response = await fetch('https://api.openai.com/v1/chat/completions', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer sk-proj-jpXBQaHemVKLxypx1WQGT3BlbkFJDrLI6jFQk2xnaHmF1OOy`
//             },
//             body: JSON.stringify({
//                 model: 'gpt-4o',
// messages: [
//     { role: 'system', content: SYSTEM_PROMPT },
//     { role: 'user', content: userInput }
// ]
//             })
//         });

//         const data = await response.json();
//         const reply = data.choices[0].message.content.trim();
//         botMessage.textContent = reply;

//         // Check for URLs in the response and refresh the page if found
//         const urlPattern = /https?:\/\/(www\.)?amazon\.com\/s\?k=[^\s&]+/g;
//         const urls = reply.match(urlPattern);
//         if (urls) {
//             chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//                 chrome.scripting.executeScript({
//                     target: { tabId: tabs[0].id },
//                     function: (url) => {
//                         window.location.href = url;
//                     },
//                     args: [urls[0]]
//                 });
//             });
//         }

//         document.getElementById('user-input').value = '';
//     }
// });

document.getElementById('send-btn').addEventListener('click', async () => {
    const userInput = document.getElementById('user-input').value;
    const chatLog = document.getElementById('chat-log');

    // Initialize or retrieve the conversation history
    let conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];

    if (userInput) {
        // Append user message to the chat log
        const userMessage = document.createElement('div');
        userMessage.className = 'message user';
        userMessage.textContent = userInput;
        chatLog.appendChild(userMessage);

        // Add user message to conversation history
        conversationHistory.push({ role: 'user', content: userInput });

        // Save conversation history to localStorage
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

        // Add bot reply to conversation history
        conversationHistory.push({ role: 'assistant', content: reply });

        // Save conversation history to localStorage
        localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));

        // Check for URLs in the response and refresh the page if found
        const urlPattern = /https?:\/\/www\.amazon\.com\/[^\s]*/g;
        const urls = reply.match(urlPattern);
        console.log(urls);
        // if (urls) {
        //     chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        //         chrome.scripting.executeScript({
        //             target: { tabId: tabs[0].id },
        //             function: (url) => {
        //                 window.location.href = url;
        //             },
        //             args: [urls[0]]
        //         });
        //     });
        // }
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
    }
});

// Load conversation history on page load
document.addEventListener('DOMContentLoaded', () => {
    const chatLog = document.getElementById('chat-log');
    const conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];

    conversationHistory.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}`;
        messageDiv.textContent = message.content;
        chatLog.appendChild(messageDiv);
    });
});
