document.addEventListener("DOMContentLoaded", () => {
    var chatInput = document.getElementById("user-input");
    // var cartButton = document.getElementById('cart-button');
    chatInput.focus();

    const chatLog = document.getElementById("chat-log");
    const conversationHistory = JSON.parse(localStorage.getItem("conversationHistory")) || [];

    const chatContainer = document.getElementById('chat-log');
    const scrollToBottom = () => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    // initial elements on onboarding
    var chatBox = document.getElementById("chat-box");

    const saveState = () => {
        chrome.storage.local.set({
            chatBoxVisible: chatBox.style.display !== "none",
            conversationHistory: conversationHistory
        });
    };

    // Function to update the chat log
    function updateChatLog() {
        chatLog.innerHTML = ""; // Clear the existing chat log
        const addedMessages = new Set(); // Set to track added messages

        conversationHistory.forEach((message) => {
            if (!addedMessages.has(message.content)) {
                const messageDiv = document.createElement("div");
                messageDiv.className = `message ${message.role}`;
                messageDiv.innerHTML = message.content; // Set innerHTML to preserve the HTML structure
                chatLog.appendChild(messageDiv);
                addedMessages.add(message.content); // Add to set to prevent duplication
            }
        });

        // chatLog.addEventListener("click", (event) => {
        //     if (event.target.classList.contains("hyperlink")) {
        //         const url = event.target.getAttribute("data-url");
        //         window.open(url, "_blank");
        //     }
        // });
    }

    // Restore state from chrome.storage
    chrome.storage.local.get(['chatBoxVisible', 'conversationHistory'], (result) => {
        if (result.conversationHistory) {
            conversationHistory.push(...result.conversationHistory);
            updateChatLog();
        }
    });

    async function sendInitial() {
        // Send initial chat message
        SYSTEM_PROMPT = `Repeat this exact message: "<p>Hi, I am ShopBot, your Amazon shopping assistant</p><p>Tell me the <b>exact item you want to shop</b> and I'll try to find it for you! I may not be exactly right but I will try.</p>
            <p>Here are examples of what you could ask me to do:</p><ul><li>I want headphones under $20.</li><li>I want Apple headphones that are noise cancelling.</li><li>I want blue noise cancelling headphones.</li></ul>"`;
        const botMessage = document.createElement("div");
        botMessage.className = "message bot";
        chatLog.appendChild(botMessage);
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer sk-proj-wpHnKm4mAg0c4p32Fd4eT3BlbkFJMshL5U0ajCnVbk9Uy8py`,
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: conversationHistory.concat([
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: "Hi, I want to start shopping on Amazon."},
                    ]),
                }),
            });
            const data = await response.json();
            let reply = data.choices[0].message.content;
            //reply = reply.replace(/ *\[[^)]*\] */g, "");
            botMessage.innerHTML = reply;
            conversationHistory.push({ role: "assistant", content: botMessage.outerHTML });
            localStorage.setItem("conversationHistory", JSON.stringify(conversationHistory));
        } catch (error) {
            botMessage.textContent = "Error: " + error.message;
        }
    }

    if (conversationHistory.length == 0) {
        sendInitial();
    }
    async function sendMessage() {
        const userInput = document.getElementById("user-input").value;

        if (userInput) {
            const userMessage = document.createElement("div");
            userMessage.className = "message user";
            userMessage.textContent = userInput;
            chatLog.appendChild(userMessage);

            conversationHistory.push({ role: "user", content: userInput });
            localStorage.setItem("conversationHistory", JSON.stringify(conversationHistory));

            SYSTEM_PROMPT = `"You are ChatGPT, a large language model
            trained by OpenAI, based on the GPT-4o architecture.
            When a user tells you what they want, always produce an Amazon url for that item with the following form: "https://www.amazon.com/".
            The query parameters should go after the slash.
            Queries that ask for attributes that correspond to the Amazon filters in the sidebar should incorporate the attributes into filters, rather than search terms.
            For example, the query "chocolate under $130" should return the url "https://www.amazon.com/s?k=chocolate&qid=1716315294&rnid=386454011&ref=sr_nr_p_36_0_0&low-price=&high-price=130", rather than "https://www.amazon.com/s?k=chocolate+under+130+dollars".
            If the user asks, take them to their cart at https://www.amazon.com/gp/cart/view.html?ref_=nav_cart.
            Handle the following edge cases as follows:
            1. **Ambiguous Input**: If the user's input is ambiguous or incomplete, ask them clarifying questions to ensure you generate the correct Amazon link.
            2. **Unavailable Product**: If the specified product is unavailable or cannot be found, suggest similar alternatives available on Amazon.
            3. **General Error Handling**: If an error occurs or you cannot fulfill the request, apologize and ask the user to rephrase or provide more details.`;

            // Send user input to OpenAI API
            const botMessage = document.createElement("div");
            botMessage.className = "message bot";
            botMessage.textContent = "Thinking...";
            chatLog.appendChild(botMessage);

            try {
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer sk-proj-wpHnKm4mAg0c4p32Fd4eT3BlbkFJMshL5U0ajCnVbk9Uy8py`,
                    },
                    body: JSON.stringify({
                        model: "gpt-4o",
                        messages: conversationHistory.concat([
                            { role: "system", content: SYSTEM_PROMPT },
                            { role: "user", content: userInput },
                        ]),
                    }),
                });

                // IN CASE AUTOMATIC REDIRECTION IS NOT POSSIBLE
                const data = await response.json();
                let reply = data.choices[0].message.content.trim();
                // const productPattern = /\[([^[\]]+)\]/; // extract product from user message

                // // Match the product term in the text using the pattern
                // const match = reply.match(productPattern);

                // // Extract the product term from the match
                // const product = match ? match[1] : null;

                // reply = reply.replace(productPattern, " "); // removing the product from the ChatGPT prompt

                function removeSurroundingParentheses(str) {
                    // Check for opening parenthesis at the start and closing parenthesis at the end
                    if (str) {
                        if (str.startsWith('(')) {
                            str = str.slice(1); // Remove the first character
                        }
                        if (str.endsWith(')')) {
                            str = str.slice(0, -1); // Remove the last character
                        }
                    }
                    return str;
                }

                // cut out the item in brackets if it exists in response, e.g. "[Amazon - Pet Rock Kit]"
                reply = reply.replace(/ *\[[^)]*\] */g, "");

                // Regular expression to match URLs
                const urlPattern = /(\[|\()?https?:\/\/[^\s\[\]()]+(\]|\))?/g;
                // const urlPattern = /https?:\/\/[^\s]+/g;
                const urlMatch = reply.match(urlPattern);
                // let rawUrl = urlMatch ? urlMatch[0] : null;
                let rawUrl = urlMatch ? urlMatch[0].replace(/[\[\]()]/g, '') : null;
                const url = removeSurroundingParentheses(rawUrl);

                if (urlMatch) {
                    if (urlMatch.length === 2) {
                        // Replace the first match with "Link" and the second with an empty string
                        reply = reply.replace(urlMatch[0], '<a href="' + url + '"class="custom-link" target="_blank">Link</a>');
                        reply = reply.replace(urlMatch[1], '');
                    } else {
                        // Replace the single match with "Link"
                        reply = reply.replace(urlMatch[0], '<a href="' + url + '"class="custom-link" target="_blank">Link</a>');
                    }
                }

                console.log(`url match: ${urlMatch}`);
                console.log(`url: ${url}`);

                // Replace URLs with buttons
                // reply = reply.replace(
                //     urlPattern,
                //     (url) =>
                //         `<a class="hyperlink" href="${url}" target="_blank">Link</a>`
                // );

                // `<div class="button-container"><button class="link-button" data-url="${url}">${product}</button></div>`

                // Set the modified reply as innerHTML to render the links
                const newBotReply = reply.replace(/: \[([^[\]]+)\]\(/, "");
                console.log(newBotReply);



                botMessage.innerHTML = newBotReply;

                console.log(botMessage);

                conversationHistory.push({ role: "assistant", content: botMessage.outerHTML });
                localStorage.setItem("conversationHistory", JSON.stringify(conversationHistory));

                // If URL is available, redirect; otherwise, continue with conversation
                if (url) {
                    chrome.tabs.query(
                        { active: true, currentWindow: true },
                        function (tabs) {
                            const firstUrl = url; // Assuming `url` contains the extracted URL
                            chrome.scripting.executeScript({
                                target: { tabId: tabs[0].id },
                                function: (url) => {
                                    window.location.href = url;
                                },
                                args: [firstUrl],
                            });
                        }
                    );
                }
                document.getElementById("user-input").value = "";
                chatInput.focus();
                scrollToBottom();
            } catch (error) {
                botMessage.textContent = "Error: " + error.message;
            }
        }
    }

    document.getElementById("send-btn").addEventListener("click", () => {
        sendMessage();
        saveState();
    });

    document.getElementById("user-input").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            sendMessage();
            saveState();
        }
    });

    // Event listener for the clear button
    document.getElementById("clear-btn").addEventListener("click", () => {
        localStorage.removeItem("conversationHistory");
        conversationHistory.length = 0; // Clear the array
        updateChatLog(); // Update the chat log to reflect the cleared history
        saveState();
    });

    function startListening() {
        document.getElementById("listening-indicator").style.display = "block";
    }

    function stopListening() {
        document.getElementById("listening-indicator").style.display = "none";
    }

    document.getElementById("voice-btn").addEventListener("click", async () => {
        const messageDiv = document.getElementById("message");

        try {
            console.log("Requesting microphone access...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("Microphone access granted");

            const recognition = new webkitSpeechRecognition();
            recognition.lang = "en-US";
            recognition.onstart = () => startListening();
            recognition.onerror = (event) => console.error("Recognition error:", event);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById("user-input").value = transcript;
                sendMessage();
                saveState();
            };

            recognition.onend = () => stopListening();
            recognition.start();
        } catch (err) {
            if (err.name === "NotAllowedError" || err.name === "SecurityError") {
                messageDiv.textContent = "Microphone access denied. Please enable it in your browser settings.";
            } else if (err.name === "PermissionDismissedError") {
                messageDiv.textContent = "Microphone access dismissed. Please grant permission to use this feature.";
            } else {
                messageDiv.textContent = "Error accessing the microphone: " + err.message;
            }
            console.error("Error accessing the microphone", err);
        }
    });

    document.getElementById("open-welcome").addEventListener("click", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
    });

    var closePopup = document.getElementById("close-popup");
    var dialog = document.querySelector("dialog");

    
    document.getElementById("help-button").addEventListener("click", () => {   
        dialog.showModal();
    });

    document.getElementById("close-modal").addEventListener("click", () => {   
        dialog.close();
    });

    // document
    //     .getElementById("navigate-button")
    //     .addEventListener("keydown", (event) => {
    //         if (event.key === "Enter") {
    //             let value = navigateButton.innerText;
    //             var chatBox = document.getElementById("chat-box");
    //             console.log(value);
    //             if (value == "Let's Chat!") {
    //                 chatBox.style.display = "block";
    //                 filterSide.style.display = "none";
    //                 pillContain.style.display = "none";
    //                 navigateButton.innerText = "View Instructions";
    //                 chatInput.focus();
    //             }
    //         }
    //     });

    closePopup.onclick = function () {
        window.close();
    };
});
