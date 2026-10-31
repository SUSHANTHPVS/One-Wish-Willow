import type { ReactNode } from 'react';
import PageIllustration from './PageIllustration';
import {
  Sprout, CalendarDays, CloudSun, Dumbbell, Music, MessageCircle,
  HeartHandshake, LifeBuoy, Languages, Target, ChartNoAxesCombined,
  UserRound, ShieldCheck, Mail, LogIn, UserRoundPlus, Mic, ScrollText,
} from 'lucide-react';

const pageIcons = {
  home: Sprout,
  calendar: CalendarDays,
  weather: CloudSun,
  fitness: Dumbbell,
  music: Music,
  assistant: MessageCircle,
  'mental-health': HeartHandshake,
  recovery: LifeBuoy,
  languages: Languages,
  goals: Target,
  statistics: ChartNoAxesCombined,
  profile: UserRound,
  privacy: ShieldCheck,
  contact: Mail,
  login: LogIn,
  register: UserRoundPlus,
  admin: ShieldCheck,
  voice: Mic,
  terms: ScrollText,
};

export type PageTopic = keyof typeof pageIcons;

interface PageTitleProps {
  topic: PageTopic;
  children: ReactNode;
  illustrated?: boolean;
}

export default function PageTitle({ topic, children, illustrated = false }: PageTitleProps) {
  const Icon = pageIcons[topic];

  const title = (
    <div className="page-title">
      <div className={`page-topic-illustration page-topic-${topic}`} aria-hidden="true">
        {topic === 'terms' ? (
          <svg viewBox="0 0 100 100" focusable="false">
            <rect x="10" y="10" width="80" height="74" rx="16" fill="#fff4de" />
            <rect x="23" y="24" width="55" height="11" rx="5.5" fill="#ffb653" />
            <rect x="23" y="43" width="43" height="7" rx="3.5" fill="#ffd69a" />
            <rect x="23" y="56" width="37" height="7" rx="3.5" fill="#ffd69a" />
            <path d="M58 58c-7 1-10 6-9 12 2 7 11 9 19 5l8-7-12-15z" fill="#ffcc75" />
            <path d="M58 53c0-8 6-13 13-13 8 0 13 6 13 14 0 5-3 9-9 12z" fill="#80532c" />
          </svg>
        ) : (
          <div className="page-topic-tile">
            <Icon size={42} strokeWidth={2.5} />
          </div>
        )}
      </div>
      {children}
    </div>
  );

  return illustrated ? (
    <div className="illustrated-title-row">
      {title}
      <PageIllustration topic={topic} />
    </div>
  ) : title;
}
