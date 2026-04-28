// WhisClaw Chat Module

const Chat = {
  ws: null,
  isConnected: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 10,
  reconnectDelay: 2000,

  init() {
    this.chatMessages = document.getElementById('chat-messages');
    this.chatForm = document.getElementById('chat-form');
    this.chatInput = document.getElementById('chat-input');

    if (!this.chatMessages || !this.chatForm || !this.chatInput) return;

    this.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    this.connectWebSocket();
  },

  connectWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(App.wsUrl);

      this.ws.onopen = () => {
        console.log('Chat WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        console.log('Chat WebSocket closed');
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.scheduleReconnect();
    }
  },

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.renderStatusMessage('Connection failed. Please refresh.');
      return;
    }

    this.reconnectAttempts++;
    this.renderStatusMessage(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connectWebSocket();
    }, this.reconnectDelay * this.reconnectAttempts);
  },

  sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message) return;

    if (!this.isConnected) {
      this.renderStatusMessage('Not connected. Please wait...');
      return;
    }

    // Render user message
    this.renderMessage(message, 'user');

    // Clear input
    this.chatInput.value = '';

    // Send via WebSocket
    try {
      this.ws.send(JSON.stringify({
        type: 'chat',
        content: message,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
      this.renderStatusMessage('Failed to send message.');
    }
  },

  handleMessage(data) {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'chat':
          this.renderMessage(message.content, 'bot');
          break;
        case 'status':
          this.handleStatusMessage(message);
          break;
        case 'error':
          this.renderStatusMessage(`Error: ${message.content}`);
          break;
        default:
          if (typeof message === 'string') {
            this.renderMessage(message, 'bot');
          }
      }
    } catch (error) {
      // If not JSON, treat as plain text bot message
      this.renderMessage(data, 'bot');
    }
  },

  handleStatusMessage(message) {
    const statusText = message.content || '';

    if (statusText.toLowerCase().includes('claws open')) {
      this.renderStatusMessage('Claws open');
    } else if (statusText.toLowerCase().includes('clacking')) {
      this.renderStatusMessage('Clacking claws...');
    } else {
      this.renderStatusMessage(statusText);
    }
  },

  renderMessage(content, sender) {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${sender}`;
    messageEl.textContent = content;

    this.chatMessages.appendChild(messageEl);
    this.scrollToBottom();
  },

  renderStatusMessage(status) {
    const existingStatus = this.chatMessages.querySelector('.status');
    if (existingStatus) {
      existingStatus.textContent = status;
    } else {
      const messageEl = document.createElement('div');
      messageEl.className = 'chat-message status';
      messageEl.textContent = status;
      this.chatMessages.appendChild(messageEl);
    }
    this.scrollToBottom();
  },

  scrollToBottom() {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
};
