import { useEffect, useMemo, useState } from 'react';
import PageTitle from '../components/PageTitle';
import PageIllustration from '../components/PageIllustration';
import { apiTranslateText } from '../api';

const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Marathi', 'Kannada', 'Bengali', 'Gujarati'] as const;

type Language = (typeof languages)[number];

const languageCodeMap: Record<Language, string> = {
  English: 'en',
  Hindi: 'hi',
  Tamil: 'ta',
  Telugu: 'te',
  Marathi: 'mr',
  Kannada: 'kn',
  Bengali: 'bn',
  Gujarati: 'gu',
};

const languageEmojiMap: Record<Language, string> = {
  English: '🇬🇧',
  Hindi: '🇮🇳',
  Tamil: '🐯',
  Telugu: '🌾',
  Marathi: '🎭',
  Kannada: '📜',
  Bengali: '🌊',
  Gujarati: '🦁',
};

interface TranslationHistory {
  id: string;
  source: Language;
  target: Language;
  original: string;
  translated: string;
  timestamp: number;
  isFavorite: boolean;
}

interface TranslatePageProps {
  currentUser: string;
  token: string;
}

function storageKey(user: string) {
  return `one-wish-${user}-translate`;
}

function historyKey(user: string) {
  return `one-wish-${user}-translate-history`;
}

function loadTranslation(user: string) {
  if (typeof window === 'undefined') {
    return { source: 'English', target: 'Hindi', text: '' };
  }
  try {
    const saved = window.localStorage.getItem(storageKey(user));
    return saved ? JSON.parse(saved) : { source: 'English', target: 'Hindi', text: '' };
  } catch {
    return { source: 'English', target: 'Hindi', text: '' };
  }
}

function loadHistory(user: string): TranslationHistory[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(historyKey(user));
    return saved ? JSON.parse(saved).slice(0, 20) : [];
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

export default function TranslatePage({ currentUser, token }: TranslatePageProps) {
  const saved = useMemo(() => loadTranslation(currentUser), [currentUser]);
  const [source, setSource] = useState<Language>(saved.source);
  const [target, setTarget] = useState<Language>(saved.target);
  const [text, setText] = useState(saved.text);
  const [translated, setTranslated] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<TranslationHistory[]>(() => loadHistory(currentUser));
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(storageKey(currentUser), JSON.stringify({ source, target, text }));
  }, [currentUser, source, target, text]);

  useEffect(() => {
    window.localStorage.setItem(historyKey(currentUser), JSON.stringify(history));
  }, [history, currentUser]);

  useEffect(() => {
    if (!text.trim()) {
      setTranslated('');
      return;
    }
  }, [text]);

  async function translateText() {
    if (!text.trim() || source === target) {
      setTranslated(text.trim());
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiTranslateText(token, {
        q: text,
        source: languageCodeMap[source],
        target: languageCodeMap[target],
      });
      
      if (!data?.translatedText) {
        setError('Translation service did not return a result. Please try again.');
        setTranslated('');
      } else {
        const result = data.translatedText;
        setTranslated(result);

        // Add to history
        const newEntry: TranslationHistory = {
          id: crypto.randomUUID(),
          source,
          target,
          original: text.trim(),
          translated: result,
          timestamp: Date.now(),
          isFavorite: false,
        };
        setHistory((prev) => [newEntry, ...prev].slice(0, 50));
      }
    } catch (err) {
      const errorMsg = (err as Error).message || 'Translation failed';
      console.error('Translation error:', errorMsg);
      
      let userMessage = 'Translation failed. ';
      if (errorMsg.includes('unavailable') || errorMsg.includes('503')) {
        userMessage = 'Translation services are busy. Try again in a moment.';
      } else if (errorMsg.includes('temporarily')) {
        userMessage = 'Translation services are temporarily busy. Please wait a moment and try again.';
      } else if (errorMsg.includes('502') || errorMsg.includes('500')) {
        userMessage = 'Translation service error. Please try again soon.';
      } else {
        userMessage = errorMsg || userMessage;
      }
      
      setError(userMessage);
      setTranslated('');
    } finally {
      setLoading(false);
    }
  }

  function swapLanguages() {
    setSource(target);
    setTarget(source);
    if (translated) {
      setText(translated);
      setTranslated(text);
    }
  }

  function toggleFavorite(id: string) {
    setHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function deleteHistoryItem(id: string) {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }

  const filteredHistory = showFavoritesOnly ? history.filter((h) => h.isFavorite) : history;

  return (
    <section className="page-card translate-page">
      <div className="page-header">
        <div>
          <PageTitle topic="languages"><h2>Translate</h2></PageTitle>
          <p>Translate phrases between 6+ Indian languages instantly.</p>
        </div>
        <PageIllustration topic="languages" />
      </div>

      <div className="language-pair">
        <div className="language-select">
          <label>From:</label>
          <select value={source} onChange={(event) => setSource(event.target.value as Language)}>
            {languages.map((lang) => (
              <option key={lang} value={lang}>{languageEmojiMap[lang]} {lang}</option>
            ))}
          </select>
        </div>

        <button className="swap-button" onClick={swapLanguages} type="button" title="Swap languages">
          ⇅
        </button>

        <div className="language-select">
          <label>To:</label>
          <select value={target} onChange={(event) => setTarget(event.target.value as Language)}>
            {languages.map((lang) => (
              <option key={lang} value={lang}>{languageEmojiMap[lang]} {lang}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="translate-form">
        <textarea
          rows={4}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type a phrase here..."
          className="translate-textarea"
        />
        <button className="full-width" type="button" onClick={translateText} disabled={loading || !text.trim()}>
          {loading ? '⏳ Translating…' : '✓ Translate'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
          <div style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.8 }}>
            💡 Translation services use free public APIs. If this persists, they may be temporarily unavailable or rate-limited.
            Try again in a few moments, or <a href="#" onClick={(e) => { e.preventDefault(); window.location.reload(); }} style={{ color: 'inherit', textDecoration: 'underline' }}>refresh the page</a>.
          </div>
        </div>
      )}

      {translated && (
        <div className="translation-result">
          <div className="result-header">
            <h4>✨ Translation</h4>
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(translated, 'result')}
              type="button"
              title="Copy translation"
            >
              {copiedId === 'result' ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          <p className="translation-text">{translated}</p>
        </div>
      )}

      <div className="history-section">
        <div className="history-header">
          <h3>📚 Translation History</h3>
          <button
            className={`filter-btn ${showFavoritesOnly ? 'active' : ''}`}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            type="button"
          >
            ⭐ Favorites {history.filter((h) => h.isFavorite).length}
          </button>
        </div>

        {filteredHistory.length ? (
          <div className="history-list">
            {filteredHistory.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-content">
                  <div className="history-languages">
                    <span className="language-tag">{languageEmojiMap[item.source]} {item.source}</span>
                    <span className="arrow">→</span>
                    <span className="language-tag">{languageEmojiMap[item.target]} {item.target}</span>
                  </div>
                  <p className="history-original">{item.original}</p>
                  <p className="history-translated">{item.translated}</p>
                  <p className="history-time">{formatTime(item.timestamp)}</p>
                </div>
                <div className="history-actions">
                  <button
                    className={`action-btn favorite ${item.isFavorite ? 'active' : ''}`}
                    onClick={() => toggleFavorite(item.id)}
                    type="button"
                    title={item.isFavorite ? 'Remove favorite' : 'Add favorite'}
                  >
                    {item.isFavorite ? '⭐' : '☆'}
                  </button>
                  <button
                    className="action-btn copy"
                    onClick={() => copyToClipboard(item.translated, item.id)}
                    type="button"
                    title="Copy translation"
                  >
                    {copiedId === item.id ? '✓' : '📋'}
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => deleteHistoryItem(item.id)}
                    type="button"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            {showFavoritesOnly ? 'No favorite translations yet. Star translations to save them!' : 'No translations yet. Start translating!'}
          </p>
        )}
      </div>
    </section>
  );
}
