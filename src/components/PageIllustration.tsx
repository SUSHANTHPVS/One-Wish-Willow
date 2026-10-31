import type { ReactNode } from 'react';
import type { PageTopic } from './PageTitle';

const shield = (
  <>
    <path d="M110 62l43 17v33c0 26-20 44-43 54-23-10-43-28-43-54V79z" fill="#70B99C" />
    <path d="M88 111l16 16 29-32" stroke="#FFF8E9" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="159" cy="153" r="16" fill="#FFCB76" />
  </>
);

const profile = (
  <>
    <circle cx="110" cy="91" r="25" fill="#FFCB76" />
    <path d="M63 165v-12c0-27 21-43 47-43s47 16 47 43v12z" fill="#70B99C" />
    <circle cx="161" cy="73" r="12" fill="#A9D6F2" />
  </>
);

const illustrations: Record<PageTopic, ReactNode> = {
  home: (
    <>
      <path d="M110 166V97" stroke="#6A9B75" strokeWidth="12" strokeLinecap="round" />
      <path d="M109 120C73 121 61 95 66 77c29-1 47 13 43 43z" fill="#A8CC8E" />
      <path d="M111 106c-2-31 21-46 48-43 2 25-15 46-48 43z" fill="#70B99C" />
      <ellipse cx="110" cy="170" rx="45" ry="9" fill="#FFCB76" />
    </>
  ),
  calendar: (
    <>
      <rect x="62" y="66" width="96" height="94" rx="16" fill="#FFCB76" />
      <path d="M62 96h96" stroke="#FFF8E9" strokeWidth="9" />
      <path d="M84 61v18m52-18v18" stroke="#A97632" strokeWidth="10" strokeLinecap="round" />
      <circle cx="88" cy="119" r="7" fill="#FFF8E9" />
      <circle cx="111" cy="119" r="7" fill="#FFF8E9" />
      <circle cx="134" cy="119" r="7" fill="#FFF8E9" />
      <rect x="81" y="137" width="37" height="9" rx="4" fill="#FFF8E9" />
    </>
  ),
  weather: (
    <>
      <circle cx="108" cy="94" r="31" fill="#FFD96B" />
      <path d="M65 146c-8-29 21-52 45-37 19-26 55-11 53 15 27-1 37 37 5 38H87c-13 0-22-5-22-16z" fill="#78B7F3" />
    </>
  ),
  fitness: (
    <>
      <path d="M79 138l62-55" stroke="#FFCB76" strokeWidth="18" strokeLinecap="round" />
      <g fill="#70B99C" transform="rotate(-42 110 110)">
        <rect x="57" y="82" width="18" height="56" rx="8" />
        <rect x="75" y="91" width="14" height="38" rx="6" />
        <rect x="145" y="82" width="18" height="56" rx="8" />
        <rect x="131" y="91" width="14" height="38" rx="6" />
      </g>
      <path d="M146 150l9 9 17-19" stroke="#E6AA59" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  music: (
    <>
      <circle cx="80" cy="143" r="20" fill="#B68EBC" />
      <circle cx="139" cy="131" r="20" fill="#B68EBC" />
      <path d="M96 140V78l60-14v63" stroke="#B68EBC" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M97 98l57-14" stroke="#D9BDD9" strokeWidth="12" />
      <circle cx="67" cy="77" r="11" fill="#FFCB76" />
    </>
  ),
  assistant: (
    <>
      <rect x="54" y="65" width="107" height="78" rx="22" fill="#78B7F3" />
      <path d="M75 135v24l28-20" fill="#78B7F3" />
      <circle cx="80" cy="103" r="7" fill="#FFF8E9" />
      <circle cx="107" cy="103" r="7" fill="#FFF8E9" />
      <circle cx="134" cy="103" r="7" fill="#FFF8E9" />
      <path d="M161 132l5 13 14 5-14 5-5 14-5-14-13-5 13-5z" fill="#FFCB76" />
    </>
  ),
  'mental-health': (
    <>
      <path d="M110 152C85 135 63 117 63 94c0-26 31-37 47-16 16-21 47-10 47 16 0 23-22 41-47 58z" fill="#DE9FB0" />
      <path d="M78 112h19l10-19 11 35 10-16h16" stroke="#FFF8E9" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M156 68l4 9 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#FFCB76" />
    </>
  ),
  recovery: (
    <>
      <circle cx="110" cy="110" r="46" fill="#FFF8E9" stroke="#DE9FB0" strokeWidth="20" />
      <path d="M110 64v18m46 28h-18m-28 46v-18m-46-28h18" stroke="#FFCB76" strokeWidth="22" />
      <path d="M96 109l10 10 20-22" stroke="#B68EBC" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  languages: (
    <>
      <rect x="51" y="65" width="76" height="70" rx="18" fill="#78B7F3" />
      <rect x="100" y="104" width="70" height="59" rx="16" fill="#FFCB76" />
      <path d="M70 119l18-37 18 37m-28-13h22" stroke="#FFF8E9" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M118 124h35m-17-9v9m-11 0c1 12 9 22 23 28m-2-28c-1 11-10 21-23 28" stroke="#A97632" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  goals: (
    <>
      <circle cx="106" cy="114" r="45" fill="#FFCB76" />
      <circle cx="106" cy="114" r="30" fill="#FFF8E9" />
      <circle cx="106" cy="114" r="16" fill="#FFCB76" />
      <path d="M106 114l49-49m-15 2 17-9-4 20" stroke="#70B99C" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  statistics: (
    <>
      <rect x="63" y="115" width="23" height="44" rx="8" fill="#78B7F3" />
      <rect x="99" y="94" width="23" height="65" rx="8" fill="#70B99C" />
      <rect x="135" y="69" width="23" height="90" rx="8" fill="#FFCB76" />
      <path d="M63 95l42-25 24 6 28-24" stroke="#B68EBC" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  profile,
  privacy: shield,
  contact: (
    <>
      <rect x="57" y="79" width="108" height="76" rx="16" fill="#78B7F3" />
      <path d="M62 85l49 38 49-38" stroke="#EAF8FF" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="157" cy="73" r="19" fill="#FFCB76" />
      <path d="M148 73l6 6 11-12" stroke="#FFF8E9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  login: (
    <>
      <rect x="92" y="64" width="64" height="100" rx="13" fill="#70B99C" />
      <path d="M57 115h66m-18-18 18 18-18 18" stroke="#FFCB76" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="140" cy="117" r="4" fill="#FFF8E9" />
    </>
  ),
  register: (
    <>
      {profile}
      <circle cx="155" cy="139" r="23" fill="#78B7F3" />
      <path d="M155 128v22m-11-11h22" stroke="#FFF8E9" strokeWidth="6" strokeLinecap="round" />
    </>
  ),
  admin: shield,
  voice: (
    <>
      <rect x="91" y="62" width="38" height="71" rx="19" fill="#B68EBC" />
      <path d="M76 112c0 46 68 46 68 0m-34 35v18m-20 0h40" stroke="#78B7F3" strokeWidth="8" strokeLinecap="round" />
      <circle cx="158" cy="79" r="11" fill="#FFCB76" />
    </>
  ),
  terms: (
    <>
      <rect x="58" y="68" width="104" height="20" rx="10" fill="#FFB659" />
      <rect x="58" y="102" width="82" height="12" rx="6" fill="#FFD79D" />
      <rect x="58" y="124" width="66" height="12" rx="6" fill="#FFD79D" />
      <circle cx="154" cy="126" r="24" fill="#7A4F26" />
      <path d="M140 128c6 8 12 16 22 24-6 8-18 12-30 8-8-2-14-10-14-18 0-10 10-16 22-14z" fill="#FFCB76" />
    </>
  ),
};

export default function PageIllustration({ topic }: { topic: PageTopic }) {
  return (
    <svg
      className={`page-illustration topic-artwork topic-artwork-${topic}`}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="34" y="44" width="152" height="132" rx="24" fill={topic === 'terms' || topic === 'goals' ? '#FFF4DE' : '#EAF5F0'} />
      {illustrations[topic]}
    </svg>
  );
}
