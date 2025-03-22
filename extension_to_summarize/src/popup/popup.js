let API_KEY = 'AIzaSyDdxeA8CniX51-H8erxReeo6n38t2571sA'; // Updated API key

async function fetchApiKey() {
    try {
        const response = await fetch('/path/to/config.json');
        const config = await response.json();
        return config.API_KEY;
    } catch (error) {
        console.error('Error fetching API key:', error);
        return '';
    }
}

let pageContent = ''; // Store page content globally

// Get page content when popup opens
async function getPageContent() {
    try {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        if (!tab) {
            console.error('No active tab found');
            return;
        }

        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                const article = document.querySelector('article') || document.querySelector('main') || document.body;
                return article.innerText;
            }
        });
        pageContent = result[0].result;
    } catch (error) {
        console.error('Error getting page content:', error);
        pageContent = '';
    }
}

// Call this when popup opens
document.addEventListener('DOMContentLoaded', async () => {
    API_KEY = await fetchApiKey();
    getPageContent();
});

document.getElementById('send-button').addEventListener('click', async () => {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    addMessageToChat('user', message);
    input.value = '';

    try {
        const prompt = `Context from webpage: ${pageContent}\n\nUser question: ${message}\n\nPlease answer the user's question based on the webpage content only. If the question cannot be answered using the webpage content, politely inform the user that you can only discuss information from the current webpage.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: {
                    text: prompt
                },
                temperature: 0.7,
                maxOutputTokens: 500,
            })
        });

        const data = await response.json();
        if (data.error) {
            if (data.error.message === 'Requested entity was not found.') {
                addMessageToChat('bot', 'Error: The requested entity was not found. Please check the API endpoint or the model name.');
            } else {
                addMessageToChat('bot', 'Error: ' + data.error.message);
            }
        } else {
            addMessageToChat('bot', data.candidates[0].output);
        }
    } catch (error) {
        addMessageToChat('bot', 'Error: ' + error.message);
    }
});

// Tab switching logic
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

document.getElementById('summarize-button').addEventListener('click', async () => {
    try {
        // First, get the article content
        const articleContent = await chrome.tabs.query({active: true, currentWindow: true}).then(async (tabs) => {
            const tab = tabs[0];
            const result = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    const article = document.querySelector('article') || document.querySelector('main') || document.body;
                    return article.innerText;
                }
            });
            return result[0].result;
        });

        // Send to Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: {
                    text: `Please summarize this article in a short paragraph: ${articleContent}`
                },
                temperature: 0.7,
                maxOutputTokens: 150,
            })
        });

        const data = await response.json();
        if (data.error) {
            if (data.error.message === 'Requested entity was not found.') {
                document.getElementById('result').innerText = 'Error: The requested entity was not found. Please check the API endpoint or the model name.';
            } else {
                document.getElementById('result').innerText = 'Error: ' + data.error.message;
            }
        } else {
            document.getElementById('result').innerText = data.candidates[0].output;
        }
    } catch (error) {
        document.getElementById('result').innerText = 'Error: ' + error.message;
    }
});

function addMessageToChat(type, text) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${type}-message`);
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Enter key to send message
document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('send-button').click();
    }
});