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
    <title>Memory Engine – Persistent AI Memory Demo</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- External CSS -->
    <link rel="stylesheet" href="styles.css">
    <!-- highlight.js dark theme -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/atom-one-dark.min.css">
    <!-- marked.js -->
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <!-- highlight.js -->
    <script src="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js"></script>
</head>
<body>
    <header class="app-header">
        <div class="header-icon">🧠</div>
        <div class="header-text">
            <div class="header-title">Memory Engine</div>
            <div class="header-subtitle">Persistent AI Memory Demo</div>
        </div>
    </header>

    <main class="chat-area" id="chatArea">
        <div class="chat-area-inner" id="chatAreaInner">
            <div class="empty-state" id="emptyState">
                <div class="empty-state-icon">💬</div>
                <div class="empty-state-text">Start a conversation with the Memory Engine. Ask anything!</div>
            </div>
        </div>
    </main>

    <footer class="input-area">
        <div class="input-area-inner">
            <div class="input-wrapper">
                <input
                    type="text"
                    class="chat-input"
                    id="chatInput"
                    placeholder="Type a message..."
                    autocomplete="off"
                    maxlength="8000"
                >
            </div>
            <button class="send-btn" id="sendBtn" aria-label="Send message" title="Send message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                <div class="spinner"></div>
            </button>
        </div>
    </footer>

    <script>
        (function() {
            const chatArea = document.getElementById('chatArea');
            const chatAreaInner = document.getElementById('chatAreaInner');
            const emptyState = document.getElementById('emptyState');
            const chatInput = document.getElementById('chatInput');
            const sendBtn = document.getElementById('sendBtn');
            let isWaiting = false;
            let typingIndicatorEl = null;

            // Configure marked.js
            if (typeof marked !== 'undefined') {
                marked.setOptions({
                    breaks: true,
                    gfm: true,
                });
                // Override link renderer to open in new tab
                const originalRenderer = new marked.Renderer();
                originalRenderer.link = function(href, title, text) {
                    const html = marked.Renderer.prototype.link.call(this, href, title, text);
                    return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
                };
                marked.use({ renderer: originalRenderer });
            }

            // Auto-scroll to bottom
            function scrollToBottom() {
                chatArea.scrollTop = chatArea.scrollHeight;
            }

            // Hide empty state when messages exist
            function toggleEmptyState() {
                const messages = chatAreaInner.querySelectorAll('.message-row, .typing-row');
                if (messages.length > 0) {
                    if (emptyState) emptyState.style.display = 'none';
                } else {
                    if (emptyState) emptyState.style.display = '';
                }
            }

            // Format timestamp
            function getFormattedTime() {
                const now = new Date();
                return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            }

            // Create a message row (user or ai)
            function createMessageRow(sender, content, isHtml = false) {
                const row = document.createElement('div');
                row.className = `message-row ${sender}`;

                // Avatar
                const avatar = document.createElement('div');
                avatar.className = `avatar ${sender === 'user' ? 'user-avatar' : 'ai-avatar'}`;
                avatar.textContent = sender === 'user' ? 'U' : 'AI';

                // Bubble
                const bubble = document.createElement('div');
                bubble.className = 'message-bubble';
                if (isHtml) {
                    bubble.innerHTML = content;
                } else {
                    bubble.textContent = content;
                }

                // Meta (timestamp)
                const meta = document.createElement('div');
                meta.className = 'message-meta';
                meta.textContent = getFormattedTime();
                bubble.appendChild(meta);

                row.appendChild(avatar);
                row.appendChild(bubble);
                return row;
            }

            // Create typing indicator
            function createTypingIndicator() {
                const row = document.createElement('div');
                row.className = 'typing-row ai';

                const avatar = document.createElement('div');
                avatar.className = 'avatar ai-avatar';
                avatar.textContent = 'AI';

                const bubble = document.createElement('div');
                bubble.className = 'typing-bubble';
                for (let i = 0; i < 3; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'typing-dot';
                    bubble.appendChild(dot);
                }

                row.appendChild(avatar);
                row.appendChild(bubble);
                return row;
            }

            // Remove typing indicator
            function removeTypingIndicator() {
                if (typingIndicatorEl && typingIndicatorEl.parentNode) {
                    typingIndicatorEl.parentNode.removeChild(typingIndicatorEl);
                    typingIndicatorEl = null;
                }
            }

            // Add message to chat
            function addMessage(sender, content, isHtml = false) {
                const row = createMessageRow(sender, content, isHtml);
                chatAreaInner.appendChild(row);
                toggleEmptyState();
                scrollToBottom();
            }

            // Process AI response (Markdown + code blocks)
            function processAiResponse(markdownText) {
                if (typeof marked === 'undefined') {
                    return '<p>' + escapeHtml(markdownText) + '</p>';
                }

                let html = marked.parse(markdownText);

                // Wrap code blocks for copy button
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;

                const preElements = tempDiv.querySelectorAll('pre');
                preElements.forEach(pre => {
                    const code = pre.querySelector('code');
                    if (!code) return;

                    const wrapper = document.createElement('div');
                    wrapper.className = 'code-block-wrapper';

                    // Move pre into wrapper
                    pre.parentNode.insertBefore(wrapper, pre);
                    wrapper.appendChild(pre);

                    // Create copy button
                    const copyBtn = document.createElement('button');
                    copyBtn.className = 'copy-btn';
                    copyBtn.textContent = 'Copy';
                    copyBtn.addEventListener('click', function() {
                        const codeText = code.innerText;
                        navigator.clipboard.writeText(codeText).then(() => {
                            copyBtn.textContent = 'Copied ✓';
                            copyBtn.classList.add('copied');
                            setTimeout(() => {
                                copyBtn.textContent = 'Copy';
                                copyBtn.classList.remove('copied');
                            }, 2000);
                        }).catch(() => {
                            // Fallback
                            copyBtn.textContent = 'Failed';
                            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
                        });
                    });
                    wrapper.appendChild(copyBtn);
                });

                // Apply syntax highlighting
                if (typeof hljs !== 'undefined') {
                    tempDiv.querySelectorAll('pre code').forEach(code => {
                        hljs.highlightElement(code);
                    });
                }

                return tempDiv.innerHTML;
            }

            // Escape HTML for safe text display
            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            // Set loading state
            function setLoading(loading) {
                isWaiting = loading;
                sendBtn.disabled = loading;
                chatInput.disabled = loading;
                if (loading) {
                    sendBtn.classList.add('loading');
                } else {
                    sendBtn.classList.remove('loading');
                    chatInput.focus();
                }
            }

            // Send message to server
            async function sendMessage(message) {
                if (isWaiting || !message.trim()) return;

                // Add user message
                addMessage('user', message);
                chatInput.value = '';
                toggleEmptyState();

                // Show typing indicator
                typingIndicatorEl = createTypingIndicator();
                chatAreaInner.appendChild(typingIndicatorEl);
                scrollToBottom();

                setLoading(true);

                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ message }),
                    });

                    if (!response.ok) {
                        throw new Error(`Server error: ${response.status}`);
                    }

                    const data = await response.json();
                    const reply = data.reply || '';

                    // Remove typing indicator
                    removeTypingIndicator();

                    // Process and display AI reply
                    const htmlContent = processAiResponse(reply);
                    addMessage('ai', htmlContent, true);

                } catch (error) {
                    console.error('Error:', error);
                    removeTypingIndicator();
                    // Show error bubble
                    const errorMsg = 'Sorry, an error occurred while processing your request. Please try again.';
                    const errorBubble = createMessageRow('ai', errorMsg, false);
                    errorBubble.querySelector('.message-bubble').classList.add('error-bubble');
                    chatAreaInner.appendChild(errorBubble);
                    scrollToBottom();
                } finally {
                    setLoading(false);
                }
            }

            // Event listeners
            sendBtn.addEventListener('click', () => {
                sendMessage(chatInput.value);
            });

            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(chatInput.value);
                }
            });

            // Initial scroll & focus
            chatInput.focus();
            scrollToBottom();
        })();
    </script>
</body>
</html>
```

### public/styles.css
```css
:root {
    --bg-primary: #0f0f0f;
    --bg-secondary: #1a1a1a;
    --bg-tertiary: #242424;
    --bg-input: #1e1e1e;
    --border-color: #2e2e2e;
    --text-primary: #ececec;
    --text-secondary: #a0a0a0;
    --text-muted: #6b6b6b;
    --accent: #6c5ce7;
    --accent-hover: #7d6ff0;
    --accent-glow: rgba(108, 92, 231, 0.3);
    --user-bubble: #2b2b3d;
    --ai-bubble: #1a1a24;
    --danger: #e74c3c;
    --success: #27ae60;
    --code-bg: #0d0d0d;
    --scrollbar-thumb: #3a3a3a;
    --scrollbar-track: transparent;
    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 20px;
    --radius-xl: 24px;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5);
    --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);
    --transition-fast: 150ms ease;
    --transition-normal: 250ms ease;
    --transition-slow: 350ms ease;
}

*,
*::before,
*::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    height: 100%;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    background-color: var(--bg-primary);
    color: var(--text-primary);
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    line-height: 1.6;
    letter-spacing: -0.01em;
}

/* Scrollbar */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
    border-radius: 3px;
}
::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 3px;
    transition: background var(--transition-fast);
}
::-webkit-scrollbar-thumb:hover {
    background: #505050;
}
::-webkit-scrollbar-corner {
    background: transparent;
}

/* Header */
.app-header {
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    padding: 14px 24px;
    display: flex;
    align-items: center;
    gap: 14px;
    flex-shrink: 0;
    z-index: 10;
    box-shadow: var(--shadow-sm);
}
.header-icon {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
    box-shadow: 0 0 20px var(--accent-glow);
}
.header-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
}
.header-title {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
}
.header-subtitle {
    font-size: 0.8rem;
    font-weight: 400;
    color: var(--text-secondary);
}

/* Chat Area */
.chat-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px 10px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    scroll-behavior: smooth;
}
.chat-area-inner {
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 100%;
    justify-content: flex-end;
}

/* Message Row */
.message-row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    animation: messageSlideIn 0.35s ease-out;
    padding: 2px 0;
}
.message-row.user {
    justify-content: flex-end;
    flex-direction: row-reverse;
}
.message-row.ai {
    justify-content: flex-start;
    flex-direction: row;
}

@keyframes messageSlideIn {
    from {
        opacity: 0;
        transform: translateY(18px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Avatar */
.avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 600;
    user-select: none;
    box-shadow: var(--shadow-sm);
    align-self: flex-end;
    margin-bottom: 2px;
}
.avatar.user-avatar {
    background: #4a4a6a;
    color: #d0d0f0;
}
.avatar.ai-avatar {
    background: #2d2d44;
    color: #b0b0e0;
    font-size: 16px;
}

/* Bubble */
.message-bubble {
    max-width: 78%;
    padding: 12px 16px;
    border-radius: var(--radius-lg);
    font-size: 0.925rem;
    line-height: 1.55;
    word-wrap: break-word;
    overflow-wrap: break-word;
    position: relative;
    box-shadow: var(--shadow-sm);
    transition: box-shadow var(--transition-normal);
}
.message-bubble:hover {
    box-shadow: var(--shadow-md);
}
.user .message-bubble {
    background: var(--user-bubble);
    border-bottom-right-radius: 6px;
    color: #e0e0f0;
    border: 1px solid rgba(255, 255, 255, 0.06);
}
.ai .message-bubble {
    background: var(--ai-bubble);
    border-bottom-left-radius: 6px;
    color: #d8d8e8;
    border: 1px solid rgba(255, 255, 255, 0.04);
}

/* Timestamp */
.message-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    font-size: 0.68rem;
    color: var(--text-muted);
    padding: 0 4px;
}
.user .message-meta {
    justify-content: flex-end;
}
.ai .message-meta {
    justify-content: flex-start;
}

/* Typing Indicator */
.typing-row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    animation: messageSlideIn 0.3s ease-out;
    padding: 2px 0;
}
.typing-row.ai {
    justify-content: flex-start;
    flex-direction: row;
}
.typing-bubble {
    background: var(--ai-bubble);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-bottom-left-radius: 6px;
    border-radius: var(--radius-lg);
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 5px;
    box-shadow: var(--shadow-sm);
    min-width: 56px;
    justify-content: center;
}
.typing-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #888;
    animation: dotBounce 1.4s infinite ease-in-out;
}
.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes dotBounce {
    0%, 80%, 100% {
        transform: scale(0.6);
        opacity: 0.35;
    }
    40% {
        transform: scale(1.15);
        opacity: 1;
    }
}

/* Input Area */
.input-area {
    flex-shrink: 0;
    padding: 12px 16px 16px 16px;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
    z-index: 10;
    box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.3);
}
.input-area-inner {
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    gap: 10px;
    align-items: center;
}
.input-wrapper {
    flex: 1;
    position: relative;
}
.chat-input {
    width: 100%;
    padding: 13px 18px;
    border-radius: var(--radius-xl);
    border: 1.5px solid var(--border-color);
    background: var(--bg-input);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    font-size: 0.925rem;
    outline: none;
    transition: all var(--transition-fast);
    resize: none;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
    letter-spacing: -0.01em;
}
.chat-input::placeholder {
    color: var(--text-muted);
    font-weight: 400;
}
.chat-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow), inset 0 1px 3px rgba(0, 0, 0, 0.2);
}
.chat-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.send-btn {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    border: none;
    background: var(--accent);
    color: #fff;
    cursor: pointer;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
    box-shadow: 0 0 16px var(--accent-glow);
    position: relative;
    overflow: hidden;
}
.send-btn:hover {
    background: var(--accent-hover);
    box-shadow: 0 0 24px rgba(108, 92, 231, 0.5);
    transform: scale(1.04);
}
.send-btn:active {
    transform: scale(0.94);
    transition: transform 80ms ease;
}
.send-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
}
.send-btn svg {
    width: 20px;
    height: 20px;
    transition: opacity var(--transition-fast);
}
.send-btn .spinner {
    display: none;
    width: 20px;
    height: 20px;
    border: 2.5px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    position: absolute;
}
.send-btn.loading svg {
    opacity: 0;
}
.send-btn.loading .spinner {
    display: block;
}
@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Markdown Content Styles (inside AI bubble) */
.ai .message-bubble h1,
.ai .message-bubble h2,
.ai .message-bubble h3,
.ai .message-bubble h4,
.ai .message-bubble h5,
.ai .message-bubble h6 {
    color: #e8e8f8;
    margin: 14px 0 6px 0;
    font-weight: 600;
    letter-spacing: -0.02em;
}
.ai .message-bubble h1 { font-size: 1.5rem; }
.ai .message-bubble h2 { font-size: 1.3rem; }
.ai .message-bubble h3 { font-size: 1.15rem; }
.ai .message-bubble h4 { font-size: 1.05rem; }
.ai .message-bubble h5,
.ai .message-bubble h6 { font-size: 0.95rem; }
.ai .message-bubble p { margin: 4px 0; }
.ai .message-bubble strong { font-weight: 600; color: #f0f0f8; }
.ai .message-bubble em { font-style: italic; color: #d0d0e8; }
.ai .message-bubble ul,
.ai .message-bubble ol {
    margin: 8px 0;
    padding-left: 22px;
}
.ai .message-bubble li { margin: 3px 0; }
.ai .message-bubble a {
    color: #8b9cf7;
    text-decoration: none;
    transition: all var(--transition-fast);
    border-bottom: 1px solid transparent;
}
.ai .message-bubble a:hover {
    text-decoration: underline;
    border-bottom-color: #8b9cf7;
}
.ai .message-bubble img {
    max-width: 100%;
    border-radius: var(--radius-sm);
    margin: 8px 0;
    display: block;
}
.ai .message-bubble blockquote {
    border-left: 3px solid var(--accent);
    background: rgba(108, 92, 231, 0.08);
    padding: 10px 16px;
    margin: 10px 0;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
    font-style: italic;
    color: #c8c8e0;
}
.ai .message-bubble blockquote p { margin: 2px 0; }
.ai .message-bubble table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin: 10px 0;
    border-radius: var(--radius-sm);
    overflow: hidden;
    display: block;
    overflow-x: auto;
    border: 1px solid rgba(255, 255, 255, 0.08);
}
.ai .message-bubble thead {
    background: rgba(255, 255, 255, 0.06);
}
.ai .message-bubble th {
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
    font-size: 0.85rem;
    color: #d8d8f0;
    white-space: nowrap;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}
.ai .message-bubble td {
    padding: 9px 14px;
    text-align: left;
    font-size: 0.85rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.ai .message-bubble tbody tr:nth-child(even) {
    background: rgba(255, 255, 255, 0.025);
}
.ai .message-bubble tbody tr:hover {
    background: rgba(255, 255, 255, 0.05);
}
.ai .message-bubble tbody tr:last-child td {
    border-bottom: none;
}
.ai .message-bubble code {
    background: rgba(255, 255, 255, 0.08);
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 0.84em;
    font-family: 'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', 'Consolas', monospace;
    color: #e0c080;
}
.ai .message-bubble pre {
    background: var(--code-bg);
    border-radius: var(--radius-md);
    padding: 16px;
    overflow-x: auto;
    margin: 10px 0;
    border: 1px solid rgba(255, 255, 255, 0.06);
    font-size: 0.84rem;
    line-height: 1.5;
    position: relative;
}
.ai .message-bubble pre code {
    background: transparent;
    padding: 0;
    border-radius: 0;
    font-size: inherit;
    color: #d4d4d4;
}
.code-block-wrapper {
    position: relative;
    margin: 10px 0;
}
.code-block-wrapper pre {
    margin: 0;
    padding-top: 40px;
}
.copy-btn {
    position: absolute;
    top: 8px;
    right: 10px;
    z-index: 5;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #ccc;
    padding: 5px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.75rem;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    transition: all var(--transition-fast);
    backdrop-filter: blur(4px);
    user-select: none;
    letter-spacing: 0.01em;
}
.copy-btn:hover {
    background: rgba(255, 255, 255, 0.16);
    border-color: rgba(255, 255, 255, 0.3);
    color: #fff;
}
.copy-btn.copied {
    background: rgba(39, 174, 96, 0.2);
    border-color: var(--success);
    color: #4eeca0;
}

/* Empty state */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 12px;
    color: var(--text-muted);
    text-align: center;
    padding: 40px 20px;
    animation: fadeIn 0.6s ease-out;
}
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
.empty-state-icon {
    font-size: 48px;
    opacity: 0.6;
    animation: float 3s ease-in-out infinite;
}
@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}
.empty-state-text {
    font-size: 0.95rem;
    font-weight: 400;
    max-width: 320px;
}

/* Error message bubble */
.error-bubble {
    background: rgba(231, 76, 60, 0.12) !important;
    border: 1px solid rgba(231, 76, 60, 0.3) !important;
    color: #f5a09a !important;
}

/* Responsive */
@media (max-width: 640px) {
    .app-header {
        padding: 10px 14px;
        gap: 10px;
    }
    .header-icon {
        width: 36px;
        height: 36px;
        font-size: 20px;
        border-radius: 10px;
    }
    .header-title { font-size: 1rem; }
    .header-subtitle { font-size: 0.7rem; }
    .chat-area {
        padding: 12px 8px 6px 8px;
        gap: 4px;
    }
    .chat-area-inner { gap: 4px; }
    .message-bubble {
        max-width: 88%;
        padding: 10px 13px;
        font-size: 0.88rem;
        border-radius: var(--radius-md);
    }
    .user .message-bubble { border-bottom-right-radius: 4px; }
    .ai .message-bubble { border-bottom-left-radius: 4px; }
    .avatar {
        width: 28px;
        height: 28px;
        font-size: 12px;
    }
    .input-area {
        padding: 8px 10px 12px 10px;
    }
    .input-area-inner { gap: 8px; }
    .chat-input {
        padding: 11px 14px;
        font-size: 0.88rem;
        border-radius: var(--radius-lg);
    }
    .send-btn {
        width: 40px;
        height: 40px;
    }
    .send-btn svg {
        width: 17px;
        height: 17px;
    }
    .send-btn .spinner {
        width: 17px;
        height: 17px;
    }
    .message-row { gap: 6px; }
    .typing-row { gap: 6px; }
    .typing-bubble { padding: 11px 16px; }
    .ai .message-bubble pre {
        padding: 12px;
        font-size: 0.78rem;
    }
    .copy-btn {
        top: 6px;
        right: 6px;
        padding: 4px 10px;
        font-size: 0.7rem;
    }
    .code-block-wrapper pre {
        padding-top: 34px;
    }
}
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
