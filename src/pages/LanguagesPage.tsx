import { useEffect, useMemo, useState } from 'react';
import PageTitle from '../components/PageTitle';
import PageIllustration from '../components/PageIllustration';

const languages = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Japanese'] as const;

type Language = (typeof languages)[number];

interface LanguagesPageProps {
  currentUser: string;
}

function storageKey(user: string) {
  return `one-wish-${user}-language-preference`;
}

function loadLanguagePreference(user: string): Language {
  if (typeof window === 'undefined') return 'English';
  try {
    const saved = window.localStorage.getItem(storageKey(user));
    return saved ? (saved as Language) : 'English';
  } catch {
    return 'English';
  }
}

const greetings: Record<Language, string> = {
  English: 'Welcome',
  Hindi: 'स्वागत है',
  Spanish: 'Bienvenido',
  French: 'Bienvenue',
  German: 'Willkommen',
  Japanese: 'ようこそ',
};

export default function LanguagesPage({ currentUser }: LanguagesPageProps) {
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(() => loadLanguagePreference(currentUser));

  useEffect(() => {
    window.localStorage.setItem(storageKey(currentUser), preferredLanguage);
  }, [currentUser, preferredLanguage]);

  const samplePhrases = useMemo(() => {
    return [
      { label: 'Good morning', text: preferredLanguage === 'English' ? 'Good morning' : greetings[preferredLanguage] },
      { label: 'How are you?', text: preferredLanguage === 'English' ? 'How are you?' : `${greetings[preferredLanguage]}?` },
    ];
  }, [preferredLanguage]);

  return (
    <section className="page-card languages-page">
      <div className="page-header">
        <div>
          <PageTitle topic="languages"><h2>Multiple Languages</h2></PageTitle>
          <p>Choose a preferred language and explore common phrases in that language.</p>
        </div>
        <PageIllustration topic="languages" />
      </div>

      <div className="calendar-form">
        <select value={preferredLanguage} onChange={(event) => setPreferredLanguage(event.target.value as Language)}>
          {languages.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      <div className="event-list">
        <article className="event-card">
          <div className="event-card-heading">
            <div>
              <h4>{greetings[preferredLanguage]}</h4>
              <p>Your selected language is {preferredLanguage}.</p>
            </div>
          </div>
        </article>
        <div className="month-group">
          {samplePhrases.map((phrase) => (
            <article key={phrase.label} className="event-card">
              <div className="event-card-heading">
                <div>
                  <h4>{phrase.label}</h4>
                  <p>{phrase.text}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
