export interface AvatarPreset {
  id: string;
  name: string;
  category: 'illustrated' | 'colors' | 'travel';
  bgColor: string;
  svg: string; // SVG data URI or SVG string
  accentColor: string;
}

// 12 curated travel & lifestyle vector avatars (including the teal girl avatar from Image 1)
export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'traveler-girl-teal',
    name: 'Viajera (Teal)',
    category: 'illustrated',
    bgColor: '#7ec1c8',
    accentColor: '#ff5722',
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="60" fill="#7ec1c8"/>
      <!-- Shirt -->
      <path d="M26 112C26 95 38 85 60 85C82 85 94 95 94 112V120H26V112Z" fill="#ff5722"/>
      <path d="M48 85L60 97L72 85C72 85 68 89 60 89C52 89 48 85 48 85Z" fill="#e57373" opacity="0.4"/>
      <!-- Neck -->
      <path d="M52 70V87C52 87 56 90 60 90C64 90 68 87 68 87V70H52Z" fill="#e6b89c"/>
      <path d="M52 70L60 85L68 70H52Z" fill="#d49b78"/>
      <!-- Back hair -->
      <path d="M36 50C34 68 37 86 48 90C45 78 47 62 47 62L73 62C73 62 75 78 72 90C83 86 86 68 84 50C82 30 76 25 60 25C44 25 38 30 36 50Z" fill="#254e58"/>
      <!-- Face -->
      <path d="M42 50C42 66 50 75 60 75C70 75 78 66 78 50V44H42V50Z" fill="#fed0b1"/>
      <!-- Front Bangs / Hair -->
      <path d="M38 46C38 46 44 58 50 58C56 58 58 48 60 48C62 48 64 58 70 58C76 58 82 46 82 46C82 30 75 25 60 25C45 25 38 30 38 46Z" fill="#254e58"/>
    </svg>`,
  },
  {
    id: 'adventurer-guy-navy',
    name: 'Aventurero (Azul)',
    category: 'illustrated',
    bgColor: '#4a69bd',
    accentColor: '#f6b93b',
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="60" fill="#4a69bd"/>
      <path d="M24 115C24 96 38 86 60 86C82 86 96 96 96 115V120H24V115Z" fill="#2c3e50"/>
      <!-- Backpack straps -->
      <rect x="36" y="86" width="8" height="34" rx="4" fill="#e67e22"/>
      <rect x="76" y="86" width="8" height="34" rx="4" fill="#e67e22"/>
      <!-- Neck -->
      <rect x="52" y="70" width="16" height="18" rx="2" fill="#fad390"/>
      <!-- Face -->
      <path d="M40 48C40 65 48 76 60 76C72 76 80 65 80 48V40H40V48Z" fill="#ffeaa7"/>
      <!-- Hair Short Cut -->
      <path d="M38 42C38 28 47 24 60 24C73 24 82 28 82 42C82 46 80 48 80 48C80 48 78 36 60 36C42 36 40 48 40 48C40 48 38 46 38 42Z" fill="#2f3542"/>
    </svg>`,
  },
  {
    id: 'explorer-woman-coral',
    name: 'Exploradora (Coral)',
    category: 'illustrated',
    bgColor: '#e17055',
    accentColor: '#ffeaa7',
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="60" fill="#e17055"/>
      <path d="M24 114C24 96 38 86 60 86C82 86 96 96 96 114V120H24V114Z" fill="#00cec9"/>
      <rect x="53" y="70" width="14" height="18" fill="#f8c291"/>
      <!-- Long Hair -->
      <path d="M34 50C34 75 36 94 46 96C42 82 44 65 44 65L76 65C76 65 78 82 74 96C84 94 86 75 86 50C86 28 78 22 60 22C42 22 34 28 34 50Z" fill="#633917"/>
      <path d="M42 48C42 64 50 74 60 74C70 74 78 64 78 48V42H42V48Z" fill="#fcdbbd"/>
      <!-- Sun Hat -->
      <path d="M22 46C30 40 50 38 60 38C70 38 90 40 98 46C92 48 75 44 60 44C45 44 28 48 22 46Z" fill="#fdcb6e"/>
      <path d="M42 38C42 26 50 22 60 22C70 22 78 26 78 38H42Z" fill="#ffeaa7"/>
      <rect x="42" y="34" width="36" height="4" fill="#d63031"/>
    </svg>`,
  },
  {
    id: 'pilot-captain-navy',
    name: 'Piloto / Capitán',
    category: 'illustrated',
    bgColor: '#1e3799',
    accentColor: '#f6b93b',
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="60" fill="#1e3799"/>
      <path d="M22 115C22 96 36 86 60 86C84 86 98 96 98 115V120H22V115Z" fill="#0c2461"/>
      <!-- Gold Pilot Stripes -->
      <rect x="25" y="102" width="12" height="3" fill="#f6b93b"/>
      <rect x="25" y="107" width="12" height="3" fill="#f6b93b"/>
      <rect x="83" y="102" width="12" height="3" fill="#f6b93b"/>
      <rect x="83" y="107" width="12" height="3" fill="#f6b93b"/>
      <!-- White Tie & Collar -->
      <path d="M52 86L60 98L68 86H52Z" fill="#f8f9fa"/>
      <path d="M58 90L60 115L62 90H58Z" fill="#f6b93b"/>
      <!-- Face -->
      <rect x="52" y="70" width="16" height="18" fill="#e4b087"/>
      <path d="M42 50C42 66 50 76 60 76C70 76 78 66 78 50V44H42V50Z" fill="#ffcca0"/>
      <!-- Pilot Cap -->
      <path d="M36 44C36 30 44 26 60 26C76 26 84 30 84 44H36Z" fill="#0c2461"/>
      <path d="M32 44C32 44 44 48 60 48C76 48 88 44 88 44C88 47 76 50 60 50C44 50 32 47 32 44Z" fill="#2c3e50"/>
      <circle cx="60" cy="36" r="5" fill="#f6b93b"/>
    </svg>`,
  },
  {
    id: 'tour-guide-emerald',
    name: 'Guía Turístico (Verde)',
    category: 'illustrated',
    bgColor: '#009688',
    accentColor: '#80cbc4',
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="60" fill="#009688"/>
      <path d="M24 114C24 95 38 85 60 85C82 85 96 95 96 114V120H24V114Z" fill="#004d40"/>
      <!-- Binoculars hanging -->
      <circle cx="54" cy="98" r="6" fill="#263238"/>
      <circle cx="66" cy="98" r="6" fill="#263238"/>
      <rect x="54" y="96" width="12" height="4" fill="#37474f"/>
      <path d="M52 85L54 94M68 85L66 94" stroke="#78909c" stroke-width="2"/>
      <!-- Face -->
      <rect x="52" y="70" width="16" height="16" fill="#dfb38b"/>
      <path d="M42 50C42 66 50 76 60 76C70 76 78 66 78 50V44H42V50Z" fill="#ffcca0"/>
      <!-- Modern Hair -->
      <path d="M40 44C40 28 48 24 60 24C72 24 80 28 80 44C80 44 68 38 60 38C52 38 40 44 40 44Z" fill="#4e342e"/>
    </svg>`,
  },
  {
    id: 'digital-nomad-purple',
    name: 'Nómada Digital (Morado)',
    category: 'illustrated',
    bgColor: '#6c5ce7',
    accentColor: '#a29bfe',
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="60" fill="#6c5ce7"/>
      <path d="M24 114C24 95 38 85 60 85C82 85 96 95 96 114V120H24V114Z" fill="#2d3436"/>
      <rect x="52" y="70" width="16" height="16" fill="#e8b298"/>
      <!-- Face -->
      <path d="M42 50C42 66 50 76 60 76C70 76 78 66 78 50V44H42V50Z" fill="#ffd1b3"/>
      <!-- Headphones -->
      <path d="M34 50C34 32 46 22 60 22C74 22 86 32 86 50" stroke="#00cec9" stroke-width="6" stroke-linecap="round"/>
      <rect x="30" y="46" width="8" height="16" rx="4" fill="#00cec9"/>
      <rect x="82" y="46" width="8" height="16" rx="4" fill="#00cec9"/>
      <!-- Curly Top Hair -->
      <circle cx="50" cy="30" r="8" fill="#2d3436"/>
      <circle cx="60" cy="26" r="9" fill="#2d3436"/>
      <circle cx="70" cy="30" r="8" fill="#2d3436"/>
    </svg>`,
  },
  {
    id: 'safari-amber',
    name: 'Safari Explorer (Ámbar)',
    category: 'illustrated',
    bgColor: '#f39c12',
    accentColor: '#f1c40f',
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="60" fill="#f39c12"/>
      <path d="M24 114C24 95 38 85 60 85C82 85 96 95 96 114V120H24V114Z" fill="#795548"/>
      <!-- Safari Scarf -->
      <path d="M48 85L60 96L72 85C72 85 66 88 60 88C54 88 48 85 48 85Z" fill="#ff7043"/>
      <rect x="52" y="70" width="16" height="16" fill="#e4b087"/>
      <path d="M42 50C42 66 50 76 60 76C70 76 78 66 78 50V44H42V50Z" fill="#ffd1b3"/>
      <!-- Safari Hat -->
      <ellipse cx="60" cy="40" rx="36" ry="10" fill="#d7ccc8"/>
      <path d="M42 40C42 28 50 24 60 24C70 24 78 28 78 40H42Z" fill="#bcaaa4"/>
      <rect x="42" y="37" width="36" height="3" fill="#5d4037"/>
    </svg>`,
  },
  {
    id: 'beach-sky',
    name: 'Viajero Playero (Cielo)',
    category: 'illustrated',
    bgColor: '#3498db',
    accentColor: '#1abc9c',
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="60" fill="#3498db"/>
      <path d="M24 114C24 95 38 85 60 85C82 85 96 95 96 114V120H24V114Z" fill="#e74c3c"/>
      <!-- Floral Shirt Accent -->
      <circle cx="44" cy="98" r="3" fill="#f1c40f"/>
      <circle cx="76" cy="98" r="3" fill="#f1c40f"/>
      <circle cx="60" cy="106" r="3" fill="#f1c40f"/>
      <rect x="52" y="70" width="16" height="16" fill="#e4b087"/>
      <path d="M42 50C42 66 50 76 60 76C70 76 78 66 78 50V44H42V50Z" fill="#ffd1b3"/>
      <!-- Sunglasses -->
      <rect x="44" y="48" width="14" height="9" rx="3" fill="#2c3e50"/>
      <rect x="62" y="48" width="14" height="9" rx="3" fill="#2c3e50"/>
      <rect x="58" y="50" width="4" height="2" fill="#2c3e50"/>
      <!-- Surfer Hair -->
      <path d="M38 46C38 30 46 24 60 24C74 24 82 30 82 46C82 46 72 36 60 36C48 36 38 46 38 46Z" fill="#f1c40f"/>
    </svg>`,
  },
];

export function getAvatarSvgDataUrl(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

export function getAvatarById(id?: string): AvatarPreset | undefined {
  if (!id) return undefined;
  return AVATAR_PRESETS.find((a) => a.id === id);
}
