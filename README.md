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
    <title>Memory Engine Chatbot</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f9; margin: 0; padding: 20px; display: flex; justify-content: center; }
        .chat-container { width: 100%; max-width: 600px; background: white; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); display: flex; flex-direction: column; height: 80vh; }
        .chat-header { background: #007bff; color: white; padding: 15px; text-align: center; border-top-left-radius: 10px; border-top-right-radius: 10px; font-size: 1.2em; font-weight: bold; }
        .chat-messages { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
        .message { max-width: 80%; padding: 10px 15px; border-radius: 20px; line-height: 1.4; }
        .user-message { align-self: flex-end; background: #007bff; color: white; border-bottom-right-radius: 0; }
        .bot-message { align-self: flex-start; background: #e9ecef; color: #333; border-bottom-left-radius: 0; }
        .chat-input-area { display: flex; padding: 15px; border-top: 1px solid #ddd; }
        .chat-input-area input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; outline: none; font-size: 1em; }
        .chat-input-area button { background: #007bff; color: white; border: none; padding: 10px 20px; margin-left: 10px; border-radius: 20px; cursor: pointer; font-size: 1em; }
        .chat-input-area button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">🧠 Memory Engine Chatbot</div>
        <div class="chat-messages" id="chat-messages">
            <div class="message bot-message">Hello! I am a smart assistant with long-term memory. What's on your mind?</div>
        </div>
        <div class="chat-input-area">
            <input type="text" id="user-input" placeholder="Type your message..." onkeypress="handleKeyPress(event)">
            <button onclick="sendMessage()">Send</button>
        </div>
    </div>

    <script>
        const chatMessages = document.getElementById('chat-messages');
        const userInput = document.getElementById('user-input');

        async function sendMessage() {
            const text = userInput.value.trim();
            if (!text) return;

            appendMessage(text, 'user-message');
            userInput.value = '';

            const loadingId = appendMessage('...', 'bot-message');

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text })
                });

                const data = await response.json();
                document.getElementById(loadingId).innerText = data.reply || data.error;
            } catch (error) {
                document.getElementById(loadingId).innerText = "Error connecting to the server.";
            }
        }

        function appendMessage(text, className) {
            const div = document.createElement('div');
            div.className = `message ${className}`;
            div.innerText = text;
            const id = 'msg-' + Date.now();
            div.id = id;
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            return id;
        }

        function handleKeyPress(event) {
            if (event.key === 'Enter') sendMessage();
        }
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
