import { useEffect, useRef, useState } from 'react';
import { apiChatAssistant } from '../api';

interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface AssistantPageProps {
  currentUser: string;
  token: string;
}

function storageKey(user: string) {
  return `one-wish-${user}-assistant`;
}

function loadMessages(user: string): AssistantMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(storageKey(user));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function buildAssistantReply(input: string) {
  const text = input.trim().toLowerCase();

  if (/remind|reminder|schedule|appointment|meeting/i.test(text)) {
    return `I’ve noted that you want help with ${input.trim()}. A practical next step is to break it into a clear reminder: set a 10-minute prep block, a 30-minute task block, and a quick review at the end.`;
  }

  if (/workout|gym|exercise|run|training|fitness/i.test(text)) {
    return `For your fitness goal, I’d suggest a realistic plan: start with a 5-minute warm-up, do 20–30 minutes of your main workout, and finish with 5 minutes of stretching or walking.`;
  }

  if (/mood|stress|anxious|sad|tired|mental|feel|happy|depressed/i.test(text)) {
    return `That sounds like something worth easing gently. Try a 3-minute reset: breathe in for 4 seconds, out for 6, then take a short walk or stretch before deciding your next step.`;
  }

  if (/goal|focus|study|project|habit|plan|productivity/i.test(text)) {
    return `A strong plan for that is to break it into three small actions today: one priority task, one short check-in, and one reward once it's done.`;
  }

  if (/translate|language|word|sentence/i.test(text)) {
    return `I can help with that. Send the text you want translated or simplified, and I'll turn it into a clearer version you can use right away.`;
  }

  if (/music|song|listen|spotify|sound|audio/i.test(text)) {
    return `Music is a powerful mood setter. A few suggestions: upbeat tracks for energy, lo-fi beats for focus, and acoustic songs for calm. What vibe are you looking for?`;
  }

  if (/sleep|tired|rest|wake|energy/i.test(text)) {
    return `Rest is essential. A wind-down routine might help: dim the lights 30 minutes before bed, turn off notifications, and try a calming activity. What time do you usually sleep?`;
  }

  if (/help|support|advice|tips|how/i.test(text)) {
    return `I'm here to help with reminders, workouts, mood support, study plans, and daily focus. Ask me about anything wellness-related and I'll offer practical steps.`;
  }

  return `I can help with reminders, workouts, mood support, study plans, and daily focus. Tell me what you want to tackle today and I’ll turn it into a simple plan.`;
}

const quickSuggestions = [
  { emoji: '📅', text: 'Plan my day' },
  { emoji: '💪', text: 'Help with a workout' },
  { emoji: '😊', text: 'Check in on my mood' },
  { emoji: '🎯', text: 'Set a goal' },
  { emoji: '🎵', text: 'Music for focus' },
  { emoji: '😴', text: 'Sleep advice' },
];

export default function AssistantPage({ currentUser, token }: AssistantPageProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>(() => loadMessages(currentUser));
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    window.localStorage.setItem(storageKey(currentUser), JSON.stringify(messages));
  }, [messages, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  async function sendMessage() {
    if (!input.trim() || isThinking) return;
    const userInput = input.trim();
    const userMessage: AssistantMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: userInput,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      const nextMessages = [...messages, userMessage];
      const result = await apiChatAssistant(token, nextMessages.map((message) => ({ role: message.role, text: message.text })));
      const assistantReply: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: result.reply || 'I’m here to help. Tell me what you want to tackle next.',        timestamp: Date.now(),      };
      setMessages((prev) => [...prev, assistantReply]);
    } catch {
      const fallbackReply: AssistantMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: buildAssistantReply(userInput),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsThinking(false);
    }
  }

  function clearConversation() {
    setMessages([]);
  }

  return (
    <section className="page-card assistant-page">
      <div className="page-header">
        <div>
          <h2>Personal Assistant</h2>
          <p>Quick advice, reminders, and support for daily focus. Your AI companion is here to help.</p>
        </div>
      </div>

      <div className="assistant-suggestions-row">
        {quickSuggestions.map((suggestion) => (
          <button key={suggestion.text} className="assistant-chip" type="button" onClick={() => setInput(suggestion.text)}>
            <span className="chip-emoji">{suggestion.emoji}</span>
            {suggestion.text}
          </button>
        ))}
      </div>

      <div className="assistant-chat-container">
        <div className="messages-area">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <p className="welcome-title">👋 Ready to chat?</p>
              <p className="welcome-text">Ask about your day, fitness goals, mood, or anything wellness-related. I'm here to support you.</p>
            </div>
          )}
          {messages.map((message) => (
            <article key={message.id} className={`chat-bubble ${message.role}`}>
              <div className="bubble-content">
                <p>{message.text}</p>
              </div>
              <span className="bubble-time">{formatTime(message.timestamp)}</span>
            </article>
          ))}
          {isThinking && (
            <article className="chat-bubble assistant thinking">
              <div className="bubble-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </article>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="assistant-input-area">
        <textarea
          rows={3}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask your assistant anything..."
          className="assistant-textarea"
        />
        <div className="assistant-input-footer">
          <button className="delete-button" onClick={clearConversation} type="button">
            Clear
          </button>
          <button className="send-button" onClick={sendMessage} type="button" disabled={isThinking}>
            {isThinking ? '⏳ Thinking…' : '✓ Send'}
          </button>
        </div>
      </div>

      <div className="chat-stats">
        <p>Messages in conversation: <strong>{messages.length}</strong></p>
      </div>
    </section>
  );
}
