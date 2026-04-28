/**
 * WhisClawChat - Chat panel functionality
 */
class WhisClawChat {
    static chatForm = null;
    static chatInput = null;
    static chatMessages = null;

    /**
     * Initialize chat panel
     */
    static init() {
        this.chatForm = document.getElementById('chat-form');
        this.chatInput = document.getElementById('chat-input');
        this.chatMessages = document.getElementById('chat-messages');

        if (!this.chatForm || !this.chatInput || !this.chatMessages) {
            console.error('Chat elements not found');
            return;
        }

        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.send();
        });

        // Add welcome message
        this.addMessage('WhisClaw', 'Hello! I am Captain Snips, your WhisClaw assistant. How can I help you today?');
    }

    /**
     * Add a message bubble to the chat
     * @param {string} sender - Message sender (user or WhisClaw)
     * @param {string} text - Message text
     */
    static addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender === 'user' ? 'user' : 'whisclaw'}`;

        const escapedText = this.escapeText(text);

        if (sender !== 'user') {
            messageDiv.innerHTML = `<div class="sender">${sender}</div>${escapedText}`;
        } else {
            messageDiv.textContent = text;
        }

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    /**
     * Send message via WebSocket
     */
    static send() {
        const text = this.chatInput.value.trim();
        if (!text) return;

        // Add user message to chat
        this.addMessage('user', text);
        this.chatInput.value = '';

        // Send via WebSocket
        if (window.whisclawApp && window.whisclawApp.sendMessage(text)) {
            // Message sent successfully
        } else {
            // Fallback to fetch API if WebSocket not available
            this.sendViaApi(text);
        }
    }

    /**
     * Send message via REST API (fallback)
     * @param {string} text - Message text
     */
    static async sendViaApi(text) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            });

            if (response.ok) {
                const data = await response.json();
                this.addMessage('WhisClaw', data.response || data.text || 'No response');
            } else {
                this.addMessage('WhisClaw', 'Sorry, there was an error processing your request.');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            this.addMessage('WhisClaw', 'Sorry, I could not reach the server.');
        }
    }

    /**
     * Escape text to prevent XSS
     * @param {string} text - Raw text
     * @returns {string} - Escaped HTML safe text
     */
    static escapeText(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
