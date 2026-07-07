# Memory Engine Node 🧠

[![npm version](https://badge.fury.io/js/memory-engine-node.svg)](https://badge.fury.io/js/memory-engine-node)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A powerful, plug-and-play dual-memory system for building highly personalized, stateful AI applications.

---

## The Challenge: Persistent Context

Building a basic chatbot with LLMs (like OpenAI, Google, or Anthropic) is incredibly easy today. However, **making that AI remember the user** across multiple sessions is notoriously difficult. 

To build a truly personalized AI, developers typically have to waste weeks wrestling with:
- **Context Window Limits:** You can't just feed the entire chat history into every prompt.
- **Vector Databases:** Setting up, hosting, and querying Pinecone, Qdrant, or ChromaDB.
- **Embedding Pipelines:** Converting text to embeddings and managing similarity searches.
- **Information Extraction:** Writing complex background tasks to summarize and extract "facts" from a user's noisy chat history.

This creates massive overhead, drives up token costs, and delays your launch.

## The Solution: Memory Engine

**Memory Engine** solves this by abstracting the entire memory architecture into a single, easy-to-use package. You simply pass in three models (Base Chat, Embedding, and Analyzer), and the engine automatically handles the rest out of the box.

- It maintains a sliding **Working Memory** for immediate conversational context.
- It constantly runs background analysis to extract crucial facts and saves them to a local **Long-Term Memory** vector store.
- It dynamically retrieves only the most relevant past memories and injects them into the prompt, giving your AI perfect recall without overflowing the context window.

Save weeks of backend development time and build personalized AI apps effortlessly.

## Where Can You Use This? 🚀

Memory Engine is perfect for applications that require long-term context and deep user personalization:
- **AI Companions & Friends:** Bots that remember a user's hobbies, family members, and past stories.
- **Personalized AI Tutors:** Educational apps that track a student's learning progress, struggling topics, and preferred teaching styles across weeks of sessions.
- **Customer Support Agents:** Bots that remember previous tickets, user frustration levels, and account details without forcing the user to repeat themselves.
- **Productivity Assistants:** Coding or writing assistants that remember your specific project architecture, coding preferences, and ongoing to-do lists.

---

## Features

- **Automated Dual-Memory Management:** Intelligently balances short-term context with long-term recall.
- **Zero Vector DB Required:** Uses a highly optimized local storage and vector math engine under the hood. No external database setup needed.
- **Multi-Provider Support:** Seamlessly integrates with major AI providers:
  - Google (Gemini)
  - OpenAI (GPT)
  - Anthropic (Claude)
  - Ollama (Local Models)
- **Production Ready:** Built-in error handling and graceful fallbacks ensure your chat never crashes even if background analysis fails.

---

### ⚠️ Crucial Project Constraint: The Embedding Model
While you can freely change your **Base Chat Model** or **Analyzer Model** at any time during a project, **your Embedding Model must remain the exact same throughout the lifecycle of your project.**

If you change the embedding model after memories have been stored, the engine will fail to retrieve older memories because the new embeddings will live in a completely different mathematical space. Choose your embedding model carefully when you start!

---

## Installation

```bash
npm install memory-engine-node
```

---

## Comprehensive Tutorial: Build a Chatbot with Express and HTML

In this tutorial, we will build a complete, working web-based chatbot using Node.js, Express, and a basic HTML/CSS/JS frontend. The `MemoryEngine` will handle persistent memory seamlessly under the hood.

### Prerequisites & Setup

1. Initialize a new Node project and install dependencies:
```bash
npm init -y
npm install express memory-engine-node
```
*(Make sure you have your API keys ready, or Ollama running locally if you prefer).*

### 1. The Backend (`server.js`)

Create a `server.js` file. We will configure our `MemoryEngine` here. Remember, you can use `ollama`, `openai`, `google`, or `anthropic` as your provider.

```javascript
const express = require('express');
const MemoryEngine = require('memory-engine-node');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public')); // Serve frontend files

// 1. Initialize the Memory Engine
const mem = new MemoryEngine(
    {
        // Base chat model (Can be changed later)
        model: "gemini-3.1-flash-lite", // or e.g. "llama3" for ollama
        provider: "google",             // 'google', 'openai', 'anthropic', or 'ollama'
        apiKey: "YOUR_API_KEY"          // Leave empty if using local ollama
    },
    {
        // Embedding model (CRITICAL: MUST NOT BE CHANGED THROUGHOUT THE PROJECT)
        model: "gemini-embedding-2",    // e.g. 'nomic-embed-text' for ollama
        provider: "google",
        apiKey: "YOUR_API_KEY"
    },
    {
        // Analyzer model (Can be changed later)
        model: "gemini-2.5-flash",
        provider: "google",
        apiKey: "YOUR_API_KEY"
    },
    "./memory-data" // Local directory for storing memories
);

// 2. Expose a Chat API Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) return res.status(400).json({ error: "Message is required" });
        
        // Let the Memory Engine handle retrieval, analysis, and response generation!
        const response = await mem.chat(userMessage);
        
        res.json({ reply: response });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(port, () => {
    console.log(`Chatbot server running at http://localhost:${port}`);
});
```

### 2. The Frontend (`public/index.html`)

Create a folder named `public` and inside it, create `index.html`. This will be our simple web interface.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Markdown Chatbot</title>
    <!-- Markdown parser -->
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            background: #111;
            color: #eee;
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .header {
            background: #1e1e1e;
            padding: 12px;
            text-align: center;
            font-weight: 600;
            font-size: 1.1rem;
            border-bottom: 1px solid #2e2e2e;
        }
        .chat-area {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .message {
            max-width: 80%;
            padding: 10px 16px;
            border-radius: 18px;
            word-wrap: break-word;
            line-height: 1.45;
            font-size: 0.95rem;
        }
        .user-message {
            align-self: flex-end;
            background: #2b2b3d;
            color: #e0e0f0;
            border-bottom-right-radius: 6px;
        }
        .bot-message {
            align-self: flex-start;
            background: #1a1a24;
            color: #d8d8e8;
            border-bottom-left-radius: 6px;
        }
        /* basic styling for markdown elements inside bot messages */
        .bot-message p {
            margin: 4px 0;
        }
        .bot-message code {
            background: rgba(255, 255, 255, 0.08);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.85em;
        }
        .bot-message pre {
            background: #0d0d0d;
            padding: 12px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 6px 0;
        }
        .bot-message pre code {
            background: transparent;
            padding: 0;
            font-size: 0.85em;
        }
        .bot-message blockquote {
            border-left: 3px solid #6c5ce7;
            padding-left: 12px;
            margin: 6px 0;
            color: #c0c0d0;
            font-style: italic;
        }
        .bot-message a {
            color: #8b9cf7;
        }
        .typing-indicator {
            align-self: flex-start;
            background: #1a1a24;
            padding: 12px 18px;
            border-radius: 18px;
            border-bottom-left-radius: 6px;
            display: flex;
            gap: 5px;
        }
        .dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #888;
            animation: blink 1.4s infinite ease-in-out;
        }
        .dot:nth-child(1) { animation-delay: 0s; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink {
            0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
        }
        .input-area {
            display: flex;
            padding: 12px;
            background: #1e1e1e;
            border-top: 1px solid #2e2e2e;
        }
        #messageInput {
            flex: 1;
            padding: 10px 16px;
            border-radius: 24px;
            border: 1px solid #3a3a3a;
            background: #111;
            color: #eee;
            outline: none;
            font-size: 0.95rem;
            transition: border-color 0.2s;
        }
        #messageInput:focus {
            border-color: #6c5ce7;
        }
        #messageInput:disabled {
            opacity: 0.5;
        }
        #sendBtn {
            margin-left: 10px;
            padding: 10px 20px;
            border-radius: 24px;
            border: none;
            background: #6c5ce7;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
            white-space: nowrap;
        }
        #sendBtn:hover {
            background: #7d6ff0;
        }
        #sendBtn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="header">Chatbot</div>

    <div class="chat-area" id="chatArea"></div>

    <div class="input-area">
        <input type="text" id="messageInput" placeholder="Type your message..." autocomplete="off" maxlength="8000">
        <button id="sendBtn">Send</button>
    </div>

    <script>
        const chatArea = document.getElementById('chatArea');
        const input = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');

        let isWaiting = false;

        function scrollToBottom() {
            chatArea.scrollTop = chatArea.scrollHeight;
        }

        function addUserMessage(text) {
            const div = document.createElement('div');
            div.className = 'message user-message';
            // User messages always as text (security)
            div.textContent = text;
            chatArea.appendChild(div);
            scrollToBottom();
        }

        function addBotMessage(markdownText) {
            const div = document.createElement('div');
            div.className = 'message bot-message';
            // Render Markdown to HTML
            if (typeof marked !== 'undefined') {
                div.innerHTML = marked.parse(markdownText);
            } else {
                // Fallback if marked fails to load
                div.textContent = markdownText;
            }
            chatArea.appendChild(div);
            scrollToBottom();
        }

        function showTypingIndicator() {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'typing-indicator';
            typingDiv.id = 'typingIndicator';
            for (let i = 0; i < 3; i++) {
                const dot = document.createElement('div');
                dot.className = 'dot';
                typingDiv.appendChild(dot);
            }
            chatArea.appendChild(typingDiv);
            scrollToBottom();
        }

        function removeTypingIndicator() {
            const el = document.getElementById('typingIndicator');
            if (el) el.remove();
        }

        async function sendMessage() {
            const message = input.value.trim();
            if (!message || isWaiting) return;

            isWaiting = true;
            sendBtn.disabled = true;
            input.disabled = true;

            addUserMessage(message);
            input.value = '';
            showTypingIndicator();

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });

                if (!response.ok) {
                    throw new Error(`Server responded with ${response.status}`);
                }

                const data = await response.json();
                removeTypingIndicator();
                addBotMessage(data.reply || '(no reply)');

            } catch (error) {
                console.error('Chat error:', error);
                removeTypingIndicator();
                addBotMessage('Oops! Something went wrong. Please try again.');
            } finally {
                isWaiting = false;
                sendBtn.disabled = false;
                input.disabled = false;
                input.focus();
            }
        }

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            }
        });

        input.focus();
    </script>
</body>
</html>
```



### 3. Run Your App
Start your server by running:
```bash
node server.js
```
Navigate to `http://localhost:3000` in your browser. Tell the bot a fact about yourself (e.g., *"My favorite language is JavaScript"*). Start a new session or refresh the page, and ask *"What is my favorite language?"*. The Memory Engine will dynamically retrieve it and answer seamlessly!

---

## How It Works (Under the Hood)

When a user sends a message:
1. **Retrieval:** The engine embeds the user's message and runs a cosine similarity search against the local vector store to find highly relevant past memories.
2. **Generation:** It combines the retrieved Long-Term Memories with the recent Working Memory and sends an optimized prompt to the Base Chat model to generate a personalized response.
3. **Analysis:** In the background, the Analyzer model observes the interaction to see if any new durable facts (e.g., "User changed their framework to Vue") were created.
4. **Storage:** If new facts are found, they are embedded and intelligently merged (inserted or updated) into the Long-Term Memory store for future use.

This architecture enables your AI to have stateful, continuous, and context-aware conversations without the headache of managing pipelines or complex prompt engineering.
