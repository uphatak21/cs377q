const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/chat', async (req, res) => {
    const response = await fetch('https://api.openai.com/v1/engines/davinci-codex/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer sk-proj-jpXBQaHemVKLxypx1WQGT3BlbkFJDrLI6jFQk2xnaHmF1OOy`
        },
        body: JSON.stringify({
            prompt: req.body.message,
            max_tokens: 150
        })
    });

    const data = await response.json();
    res.json(data);
});

app.listen(port, () => {
    console.log(`Proxy server listening at http://localhost:${port}`);
});
