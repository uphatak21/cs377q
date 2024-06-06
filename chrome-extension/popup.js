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
            3. **General Error Handling**: If an error occurs or you cannot fulfill the request, apologize and ask the user to rephrase or provide more details.
            4. **Multiple items** If the user asks you for suggestions on what to get and you respond with a list, also clarify that they need to select one type of item before you can guide them further.`;
            

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

    let recognitionTimeout;

    document.getElementById("voice-btn").addEventListener("click", async () => {
        const messageDiv = document.getElementById("message");

        try {
            console.log("Requesting microphone access...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("Microphone access granted");

            const recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onstart = () => startListening();
            recognition.onerror = (event) => console.error("Recognition error:", event);

            // Create a variable to store the recognition result
            let finalTranscript = '';

            // Event handler for when recognition returns a result
            recognition.onresult = function (event) {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                        document.getElementById("user-input").value = finalTranscript;
                        saveState();
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
            };

            recognition.onend = () => {
                // Do nothing here because we want it to end only after 10 seconds
            };

            recognition.start();

            // Set a timeout to stop listening after 10 seconds (10000 ms)
            setTimeout(() => {
                stopListening(recognition);
            }, 10000); // Adjust the duration as needed

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

    function startListening(recognition) {
        const listeningIndicator = document.getElementById("listening-indicator");
        listeningIndicator.style.display = "block";
        listeningIndicator.textContent = "Listening for 10s...";

        let countdown = 10;
        recognitionTimeout = setInterval(() => {
            countdown -= 1;
            listeningIndicator.textContent = `Listening for ${countdown}s...`;
            if (countdown <= 0) {
                clearInterval(recognitionTimeout);
                stopListening(recognition);
            }
        }, 1000);
    }

    function stopListening(recognition) {
        clearInterval(recognitionTimeout);
        recognition.stop();
        const listeningIndicator = document.getElementById("listening-indicator");
        listeningIndicator.style.display = "none";
    }

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

    closePopup.onclick = function () {
        window.close();
    };
});
