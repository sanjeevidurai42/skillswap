/**
 * SkillSwap - Google Gemini AI Copilot Client
 * Developer: Sanjeeviraj
 */

let aiConversationHistory = [];
let isAiCopilotOpen = false;

document.addEventListener('DOMContentLoaded', () => {
  initAiCopilotWidget();
});

function initAiCopilotWidget() {
  // Prevent duplicate mounts
  if (document.getElementById('ai-copilot-container')) return;

  const container = document.createElement('div');
  container.id = 'ai-copilot-container';
  container.innerHTML = `
    <!-- Floating Launcher Button -->
    <div class="ai-copilot-launcher" onclick="toggleAiCopilot()" id="ai-launcher-btn" title="Open SkillSwap AI Copilot (Gemini 3.8 Flash)">
      <span class="pulse-dot"></span>
      <i class="fas fa-sparkles text-cyan"></i>
      <span>AI Copilot</span>
    </div>

    <!-- Floating Chat Window -->
    <div class="ai-copilot-panel hidden" id="ai-copilot-panel">
      <!-- Header -->
      <div class="ai-copilot-header">
        <div class="flex items-center gap-2">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-violet), var(--secondary-cyan)); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.95rem;">
            <i class="fas fa-robot"></i>
          </div>
          <div>
            <h4 style="font-size: 0.95rem; color: #fff; margin: 0;">SkillSwap AI Copilot</h4>
            <span style="font-size: 0.72rem; color: #10b981; display: flex; align-items: center; gap: 4px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span> Gemini 3.8 Flash Online
            </span>
          </div>
        </div>
        <button onclick="toggleAiCopilot()" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem;">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Messages Area -->
      <div class="ai-copilot-body" id="ai-messages-list">
        <div class="ai-msg ai-msg-bot">
          👋 Hi! I am your <strong>SkillSwap AI Copilot</strong>, powered by Google Gemini. Ask me for study roadmaps, partner suggestions, or tips for structuring effective peer sessions!
          
          <div style="margin-top: 0.75rem;">
            <span style="display: block; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px;">QUICK PROMPTS:</span>
            <div class="ai-prompt-chip" onclick="sendAiPrompt('How should I structure a 45-minute peer learning session?')">⏱️ 45-Min Session Tips</div>
            <div class="ai-prompt-chip" onclick="sendAiPrompt('Suggest 3 mini-project ideas combining Python and Web Dev.')">💡 Project Ideas</div>
            <div class="ai-prompt-chip" onclick="sendAiPrompt('How does the SkillSwap skill points and feedback system work?')">⭐ Skill Points Rule</div>
          </div>
        </div>
      </div>

      <!-- Input Footer -->
      <div class="ai-copilot-footer">
        <input type="text" id="ai-user-input" placeholder="Ask AI Copilot anything..." onkeydown="handleAiInputKey(event)">
        <button onclick="sendUserAiMessage()" class="btn btn-sm btn-primary" id="ai-send-btn" style="padding: 0.5rem 0.85rem;">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(container);
}

window.toggleAiCopilot = function() {
  const panel = document.getElementById('ai-copilot-panel');
  if (!panel) return;

  isAiCopilotOpen = !isAiCopilotOpen;
  if (isAiCopilotOpen) {
    panel.classList.remove('hidden');
    const input = document.getElementById('ai-user-input');
    if (input) input.focus();
  } else {
    panel.classList.add('hidden');
  }
};

window.handleAiInputKey = function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendUserAiMessage();
  }
};

window.sendAiPrompt = function(promptText) {
  const input = document.getElementById('ai-user-input');
  if (input) {
    input.value = promptText;
    sendUserAiMessage();
  }
};

window.sendUserAiMessage = async function() {
  const input = document.getElementById('ai-user-input');
  const message = input.value.trim();
  if (!message) return;

  input.value = '';
  appendAiMessage('user', message);

  const sendBtn = document.getElementById('ai-send-btn');
  if (sendBtn) sendBtn.disabled = true;

  // Add bot loading bubble
  const loadingId = 'ai-loading-' + Date.now();
  appendAiLoadingBubble(loadingId);

  try {
    const res = await api.post('/ai/chat', {
      message: message,
      conversationHistory: aiConversationHistory
    });

    removeAiLoadingBubble(loadingId);

    if (res && res.success && res.reply) {
      appendAiMessage('bot', res.reply);
      aiConversationHistory.push({ role: 'user', content: message });
      aiConversationHistory.push({ role: 'model', content: res.reply });
    } else {
      appendAiMessage('bot', 'Sorry, I encountered an issue retrieving the AI response. Please try again.');
    }
  } catch (err) {
    removeAiLoadingBubble(loadingId);
    appendAiMessage('bot', 'Error: ' + (err.message || 'Unable to contact Gemini AI engine. Please check network connection.'));
  } finally {
    if (sendBtn) sendBtn.disabled = false;
  }
};

function appendAiMessage(role, text) {
  const list = document.getElementById('ai-messages-list');
  if (!list) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `ai-msg ${role === 'user' ? 'ai-msg-user' : 'ai-msg-bot'}`;

  // Basic formatting (convert bold and newlines)
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^#+ (.*$)/gim, '<strong style="color: #fff; display:block; margin-top: 4px;">$1</strong>')
    .replace(/\n/g, '<br>');

  msgDiv.innerHTML = formatted;
  list.appendChild(msgDiv);
  list.scrollTop = list.scrollHeight;
}

function appendAiLoadingBubble(id) {
  const list = document.getElementById('ai-messages-list');
  if (!list) return;

  const loadingDiv = document.createElement('div');
  loadingDiv.id = id;
  loadingDiv.className = 'ai-msg ai-msg-bot';
  loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin text-cyan"></i> <em>Gemini is thinking...</em>';
  list.appendChild(loadingDiv);
  list.scrollTop = list.scrollHeight;
}

function removeAiLoadingBubble(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}
