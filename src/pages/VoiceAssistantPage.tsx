import { useEffect, useState } from 'react';

interface VoiceAssistantPageProps {
  currentUser: string;
}

export default function VoiceAssistantPage({ currentUser }: VoiceAssistantPageProps) {
  const [message, setMessage] = useState('Hello Willow, how can I help?');
  const [transcript, setTranscript] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [log, setLog] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = window.localStorage.getItem(`one-wish-${currentUser}-voice-log`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(`one-wish-${currentUser}-voice-log`, JSON.stringify(log));
  }, [log, currentUser]);

  function speakText(text: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function handleAsk() {
    if (!message.trim()) return;
    const normalized = message.trim().toLowerCase();
    let reply = 'I am here for you. Ask me to remind you, translate a phrase, or plan your next step.';

    if (normalized.includes('remind')) {
      reply = 'I will remind you to pause, stretch, or take a breath when it is time.';
    } else if (normalized.includes('translate')) {
      reply = 'Try the translate page for quick language support.';
    } else if (normalized.includes('fitness')) {
      reply = 'A short walk or stretch is a great way to reset your energy.';
    } else if (normalized.includes('music')) {
      reply = 'Open your music hub to save a playlist and set your mood.';
    }

    setLog((prev) => [`You: ${message}`, `Assistant: ${reply}`, ...prev]);
    setTranscript(reply);
    speakText(reply);
  }

  function startListening() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscript('Voice input is unavailable in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setMessage(text);
      setTranscript(`Recognized: ${text}`);
      setListening(false);
    };
    recognition.onerror = () => {
      setTranscript('Sorry, voice recognition failed.');
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
  }

  return (
    <section className="page-card voice-assistant-page">
      <div className="page-header">
        <div>
          <h2>Voice Assistant</h2>
          <p>Speak or type a request and let the app answer you out loud.</p>
        </div>
      </div>

      <div className="calendar-form">
        <textarea
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Tell your assistant anything..."
        />
        <div className="voice-controls">
          <button type="button" className="full-width" onClick={handleAsk}>
            {speaking ? 'Speaking…' : 'Send to voice assistant'}
          </button>
          <button type="button" className="text-button" onClick={startListening}>
            {listening ? 'Listening…' : 'Use voice input'}
          </button>
        </div>
      </div>

      <div className="event-list">
        <article className="event-card">
          <div className="event-card-heading">
            <div>
              <h4>Assistant response</h4>
              <p>{transcript || 'Responses will appear here.'}</p>
            </div>
          </div>
        </article>
        {log.length ? (
          log.map((entry, index) => (
            <article key={`${entry}-${index}`} className="event-card">
              <p>{entry}</p>
            </article>
          ))
        ) : (
          <p className="empty-state">Your voice log is empty. Start by sending a request.</p>
        )}
      </div>
    </section>
  );
}
