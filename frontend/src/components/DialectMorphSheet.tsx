import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  BookOpen,
  Volume2,
  Plus,
  Minus,
  CheckCircle2,
  X,
  ArrowRight,
  Filter,
  Sliders,
} from 'lucide-react';
import {
  MorphTranslateResponse,
  MorphRulesResponse,
  swararekheApi,
} from '../api/swararekheClient';
import { hardwareSoundEngine } from '../utils/hardwareSoundEngine';

interface DialectMorphSheetProps {
  activeRegionCode: string;
  onSelectRegion: (regionCode: string) => void;
  externalSeedPhrase?: string;
}

const QUICK_PROMPT_KEYS = [
  { label: 'WHERE ARE YOU GOING?', text: 'Where are you going?', lang: 'en' as const },
  { label: 'HOW ARE YOU?', text: 'How are you?', lang: 'en' as const },
  { label: 'VERY GOOD / FINE', text: 'Very good, fine', lang: 'en' as const },
  { label: 'HAVE YOU EATEN?', text: 'Have you eaten?', lang: 'en' as const },
  {
    label: 'ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀರಿ? ಊಟ...',
    text: 'ನೀನು ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀಯಾ? ಊಟ ಚೆನ್ನಾಗಿದೆ, ತುಂಬಾ ಬೇಕು',
    lang: 'kn' as const,
  },
];

const REGION_BADGES: Record<string, { kannada: string; short: string }> = {
  hubballi_dharwad: { kannada: 'ಉತ್ತರ ಕರ್ನಾಟಕ', short: 'Dharwad-Belagavi' },
  kundapura_mangaluru: { kannada: 'ಕರಾವಳಿ', short: 'Kundapura-Mangaluru' },
  kalaburagi_bidar: { kannada: 'ಕಲ್ಯಾಣ ಕರ್ನಾಟಕ', short: 'Kalaburagi-Bidar' },
  arebhashe_kodagu: { kannada: 'ಅರೆಭಾಷೆ', short: 'Malnad & Kodagu' },
  bengaluru_mysuru: { kannada: 'ಹಳೆ ಮೈಸೂರು', short: 'Bengaluru-Mysuru' },
};

export const DialectMorphSheet: React.FC<DialectMorphSheetProps> = ({
  activeRegionCode,
  onSelectRegion,
  externalSeedPhrase,
}) => {
  const [inputText, setInputText] = useState('Where are you going?');
  const [sourceLang, setSourceLang] = useState<'en' | 'kn'>('en');
  const [targetRegionFilter, setTargetRegionFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [morphData, setMorphData] = useState<MorphTranslateResponse | null>(null);
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({
    hubballi_dharwad: true,
  });
  const [isRulebookOpen, setIsRulebookOpen] = useState(false);
  const [rulebook, setRulebook] = useState<MorphRulesResponse | null>(null);
  const [playingAudioRegion, setPlayingAudioRegion] = useState<string | null>(null);
  const [audioFeedback, setAudioFeedback] = useState<string | null>(null);

  // Isogloss Continuum Crossfader State (Interactive Feature 2)
  const [crossfadeRegion, setCrossfadeRegion] = useState<string>(
    activeRegionCode !== 'bengaluru_mysuru' ? activeRegionCode : 'hubballi_dharwad'
  );
  const [crossfadeValue, setCrossfadeValue] = useState<number>(50);
  const lastDetentTierRef = useRef<number>(2);

  const handleCrossfadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setCrossfadeValue(val);
    const tier = Math.min(3, Math.floor(val / 25));
    if (tier !== lastDetentTierRef.current) {
      lastDetentTierRef.current = tier;
      hardwareSoundEngine.playRotaryDetent();
    }
  };

  const handleCrossfadeRelease = () => {
    hardwareSoundEngine.playKeyClick();
  };

  const getCrossfadeDisplay = (regionCode: string, value: number) => {
    const tier = Math.min(3, Math.floor(value / 25));

    const DIALECT_STAGES: Record<
      string,
      {
        kannada: { text: string; isMutated: boolean; note?: string }[][];
        roman: { text: string; isMutated: boolean }[][];
        rules: string[];
      }
    > = {
      hubballi_dharwad: {
        kannada: [
          [
            { text: 'ನೀನು', isMutated: false },
            { text: 'ಎಲ್ಲಿಗೆ', isMutated: false },
            { text: 'ಹೋಗುತ್ತಿದ್ದೀಯಾ?', isMutated: false },
            { text: 'ಊಟ', isMutated: false },
            { text: 'ಚೆನ್ನಾಗಿದೆ,', isMutated: false },
            { text: 'ತುಂಬಾ', isMutated: false },
            { text: 'ಬೇಕು', isMutated: false },
          ],
          [
            { text: 'ನೀವು', isMutated: true, note: 'Honorific pronominal shift' },
            { text: 'ಯಲ್ಲಿಗೆ', isMutated: true, note: 'Palatal glide fronting [e->ya]' },
            { text: 'ಹೋಗುತ್ತಿದ್ದೀರಿ?', isMutated: false },
            { text: 'ಊಟ', isMutated: false },
            { text: 'ಚಲೋ', isMutated: true, note: 'Marathi contact root cholo' },
            { text: 'ಐತಿ,', isMutated: true, note: 'Stative ayti' },
            { text: 'ಬಾಳ್', isMutated: true, note: 'Intensifier bhaal' },
            { text: 'ಬೇಕು', isMutated: false },
          ],
          [
            { text: 'ನೀವ್', isMutated: true, note: 'Fast speech vowel syncope' },
            { text: 'ಯಲ್ಲಿಗ್', isMutated: true, note: 'Terminal vowel deletion' },
            { text: 'ಹೊಂಟಿದ್ದೀರಿ?', isMutated: true, note: 'Verb stem shift [hogu -> hontu]' },
            { text: 'ಊಟ', isMutated: false },
            { text: 'ಚಲೋ', isMutated: true },
            { text: 'ಐತ್ರಿ,', isMutated: true, note: 'Polite -ri enclitic lock' },
            { text: 'ಬಾಳ್', isMutated: true },
            { text: 'ಬೇಕ್ರಿ', isMutated: true, note: 'Directive bek-ri' },
          ],
          [
            { text: 'ನೀವ್', isMutated: true },
            { text: 'ಯಲ್ಲಿಗ್', isMutated: true },
            { text: 'ಹೊಂಟಿರ್‍ರೀ', isMutated: true, note: 'Geminate rising question inflection' },
            { text: 'ಪಾ?', isMutated: true, note: 'Vocative pa particle' },
            { text: 'ಊಟ', isMutated: false },
            { text: 'ಬಾಳ್', isMutated: true },
            { text: 'ಚಲೋ', isMutated: true },
            { text: 'ಐತ್ರಿ!', isMutated: true, note: 'Sharp terminal staccato' },
          ],
        ],
        roman: [
          [
            { text: 'Neenu', isMutated: false },
            { text: 'ellige', isMutated: false },
            { text: 'hoguttiddiya?', isMutated: false },
            { text: 'Oota', isMutated: false },
            { text: 'chennagide,', isMutated: false },
            { text: 'tumba', isMutated: false },
            { text: 'beku', isMutated: false },
          ],
          [
            { text: 'Neevu', isMutated: true },
            { text: 'yallige', isMutated: true },
            { text: 'hoguttiddiri?', isMutated: false },
            { text: 'Oota', isMutated: false },
            { text: 'cholo', isMutated: true },
            { text: 'ayti,', isMutated: true },
            { text: 'bhaal', isMutated: true },
            { text: 'beku', isMutated: false },
          ],
          [
            { text: 'Neev', isMutated: true },
            { text: 'yallig', isMutated: true },
            { text: 'hontiddiri?', isMutated: true },
            { text: 'Oota', isMutated: false },
            { text: 'cholo', isMutated: true },
            { text: 'aytri,', isMutated: true },
            { text: 'bhaal', isMutated: true },
            { text: 'bekri', isMutated: true },
          ],
          [
            { text: 'Neev', isMutated: true },
            { text: 'yallig', isMutated: true },
            { text: 'hontirre', isMutated: true },
            { text: 'pa?', isMutated: true },
            { text: 'Oota', isMutated: false },
            { text: 'bhaal', isMutated: true },
            { text: 'cholo', isMutated: true },
            { text: 'aytri!', isMutated: true },
          ],
        ],
        rules: [
          'Canonical literary register baseline with standard unvoiced suffixes.',
          'Lexical root borrowing: Palatalization (ellige -> yallige) + Marathi loanword cholo.',
          'Morpho-syntactic verb contraction: stem alteration (hogu -> hontu) + polite alveolar honorific -ri.',
          'Terminal acoustic lock: Geminate lengthened vowel inflection (-irre) + colloquial vocative pa.',
        ],
      },
      kundapura_mangaluru: {
        kannada: [
          [
            { text: 'ನೀನು', isMutated: false },
            { text: 'ಎಲ್ಲಿಗೆ', isMutated: false },
            { text: 'ಹೋಗುತ್ತಿದ್ದೀಯಾ?', isMutated: false },
            { text: 'ಊಟ', isMutated: false },
            { text: 'ಚೆನ್ನಾಗಿದೆ', isMutated: false },
          ],
          [
            { text: 'ನೀವು', isMutated: true, note: 'Polite address' },
            { text: 'ಯಾಥಕ್', isMutated: true, note: 'Tulu-Kannada interrogative yathak' },
            { text: 'ಹೋಗುತ್ತಿದ್ದೀರಿ?', isMutated: false },
            { text: 'ಕೂಳು', isMutated: true, note: 'Coastal culinary register koolu' },
            { text: 'ಲಾಯ್ಕ್ ಆಗಿದೆ', isMutated: true, note: 'Tulu loanword laayk' },
          ],
          [
            { text: 'ಮಾಣಿ,', isMutated: true, note: 'Coastal vocative maani' },
            { text: 'ಯಾಥಕ್', isMutated: true },
            { text: 'ಹೋಯ್ತಿದ್ದೀಯ?', isMutated: true, note: 'Coastal glide insertion [hogu -> hoyi]' },
            { text: 'ಕೂಳು', isMutated: true },
            { text: 'ಲಾಯ್ಕ್ ಆಯಿತ್', isMutated: true, note: 'Halegannada past retention ayith' },
          ],
          [
            { text: 'ಮಾಣಿ,', isMutated: true },
            { text: 'ಯಾಥಕ್', isMutated: true },
            { text: 'ಹೋಯ್ತಿದ್ದಿ?', isMutated: true, note: 'Clipped terminal syllable' },
            { text: 'ಕೂಳು', isMutated: true },
            { text: 'ಬಾರಿ', isMutated: true, note: 'Intensifier baari' },
            { text: 'ಲಾಯ್ಕ್', isMutated: true },
            { text: 'ಆಂಡ್', isMutated: true },
            { text: 'ಪೋಯಿ!', isMutated: true, note: 'Melodic undulating terminal cadence' },
          ],
        ],
        roman: [
          [
            { text: 'Neenu', isMutated: false },
            { text: 'ellige', isMutated: false },
            { text: 'hoguttiddiya?', isMutated: false },
            { text: 'Oota', isMutated: false },
            { text: 'chennagide', isMutated: false },
          ],
          [
            { text: 'Neevu', isMutated: true },
            { text: 'yathak', isMutated: true },
            { text: 'hoguttiddiri?', isMutated: false },
            { text: 'Koolu', isMutated: true },
            { text: 'laayk agide', isMutated: true },
          ],
          [
            { text: 'Maani,', isMutated: true },
            { text: 'yathak', isMutated: true },
            { text: 'hoitiddiya?', isMutated: true },
            { text: 'Koolu', isMutated: true },
            { text: 'laayk aayith', isMutated: true },
          ],
          [
            { text: 'Maani,', isMutated: true },
            { text: 'yathak', isMutated: true },
            { text: 'hoitiddi?', isMutated: true },
            { text: 'Koolu', isMutated: true },
            { text: 'baari', isMutated: true },
            { text: 'laayk', isMutated: true },
            { text: 'aand', isMutated: true },
            { text: 'poyi!', isMutated: true },
          ],
        ],
        rules: [
          'Canonical literary register baseline with standard unvoiced suffixes.',
          'Substrate ingression: Tulu root laayk (pleasant) and coastal koolu (rice/meal).',
          'Glide lenition: Intervocalic glide insertion [hogu -> hoyi] and vocative maani.',
          'Melodic sing-song cadence: Terminal compound verb serialization (aand poyi) and high pitch apex.',
        ],
      },
      kalaburagi_bidar: {
        kannada: [
          [
            { text: 'ನೀವು', isMutated: false },
            { text: 'ಎಲ್ಲಿಗೆ', isMutated: false },
            { text: 'ಹೋಗುತ್ತಿದ್ದೀರಿ?', isMutated: false },
            { text: 'ಊಟ', isMutated: false },
            { text: 'ಚೆನ್ನಾಗಿದೆ', isMutated: false },
          ],
          [
            { text: 'ನೀವು', isMutated: false },
            { text: 'ಯಲ್ಲಿಗೆ', isMutated: true, note: 'Vowel lowering' },
            { text: 'ಹೋಗ್ಲಿಕತ್ತೀರಿ?', isMutated: true, note: 'Continuous aspect marker -kattu' },
            { text: 'ಊಟ', isMutated: false },
            { text: 'ಚಲೋ ಇದೆ', isMutated: true, note: 'Cholo root' },
          ],
          [
            { text: 'ನೀವು', isMutated: false },
            { text: 'ಜಲ್ದಿ', isMutated: true, note: 'Dakhni Urdu contact loan jaldi' },
            { text: 'ಹೋಗ್ಲಿಕತ್ತೀರೇನ್ರೀ?', isMutated: true, note: 'Syllabic honorific -reenri' },
            { text: 'ಊಟ', isMutated: false },
            { text: 'ಮಸ್ತ್', isMutated: true, note: 'Perso-Arabic mast' },
            { text: 'ಚಲೋ ಅದ', isMutated: true, note: 'Stative ada' },
          ],
          [
            { text: 'ನೀವು', isMutated: false },
            { text: 'ಜಲ್ದಿ', isMutated: true },
            { text: 'ಹೋಗ್ಲಿಕತ್ತೀರಿ', isMutated: true },
            { text: 'ನೋಡ್ರಿ,', isMutated: true, note: 'Affirmative focus enclitic nodri' },
            { text: 'ಊಟ', isMutated: false },
            { text: 'ಮಸ್ತ್', isMutated: true },
            { text: 'ಚಲೋ', isMutated: true },
            { text: 'ಅದ!', isMutated: true, note: 'Falling drawl terminal cadence' },
          ],
        ],
        roman: [
          [
            { text: 'Neevu', isMutated: false },
            { text: 'ellige', isMutated: false },
            { text: 'hoguttiddiri?', isMutated: false },
            { text: 'Oota', isMutated: false },
            { text: 'chennagide', isMutated: false },
          ],
          [
            { text: 'Neevu', isMutated: false },
            { text: 'yallige', isMutated: true },
            { text: 'hoglikattiri?', isMutated: true },
            { text: 'Oota', isMutated: false },
            { text: 'cholo ide', isMutated: true },
          ],
          [
            { text: 'Neevu', isMutated: false },
            { text: 'jaldi', isMutated: true },
            { text: 'hoglikatteerenri?', isMutated: true },
            { text: 'Oota', isMutated: false },
            { text: 'mast', isMutated: true },
            { text: 'cholo ada', isMutated: true },
          ],
          [
            { text: 'Neevu', isMutated: false },
            { text: 'jaldi', isMutated: true },
            { text: 'hoglikattiri', isMutated: true },
            { text: 'nodri,', isMutated: true },
            { text: 'Oota', isMutated: false },
            { text: 'mast', isMutated: true },
            { text: 'cholo', isMutated: true },
            { text: 'ada!', isMutated: true },
          ],
        ],
        rules: [
          'Canonical literary register baseline with standard unvoiced suffixes.',
          'Aspectual shift: Progressive particle replacement (-uttiddiri -> -likattiri).',
          'Dakhni contact vocabulary: Adverbial loanwords (jaldi, mast) + copula ada.',
          'Conversational cadence: Enclitic affirmative discourse marker nodri + falling terminal drawl.',
        ],
      },
      arebhashe_kodagu: {
        kannada: [
          [
            { text: 'ನೀನು', isMutated: false },
            { text: 'ಎಲ್ಲಿಗೆ', isMutated: false },
            { text: 'ಹೋಗುತ್ತಿದ್ದೀಯಾ?', isMutated: false },
            { text: 'ಊಟ', isMutated: false },
            { text: 'ಚೆನ್ನಾಗಿದೆ', isMutated: false },
          ],
          [
            { text: 'ನೀವು', isMutated: true },
            { text: 'ಯೆತ್ತಕ್', isMutated: true, note: 'Front vowel shift [e -> ye]' },
            { text: 'ಹೋಗ್ತಿದ್ದಿರ?', isMutated: false },
            { text: 'ಕೂಳು', isMutated: true, note: 'Malnad culinary root koolu' },
            { text: 'ಚಲೋ ಇದೆ', isMutated: true },
          ],
          [
            { text: 'ನೀವು', isMutated: false },
            { text: 'ಯೆತ್ತಕ್', isMutated: true },
            { text: 'ಹೋಗ್ಡೆ?', isMutated: true, note: 'Arebhashe contracted finite verb hogde' },
            { text: 'ಕೂಳು', isMutated: true },
            { text: 'ಚೋಲೋ ಉಳ್ಳ', isMutated: true, note: 'Existential verb ulla' },
          ],
          [
            { text: 'ನೀವು', isMutated: false },
            { text: 'ಯೆತ್ತಕ್', isMutated: true },
            { text: 'ಹೋಗ್ದೆ?', isMutated: true },
            { text: 'ಕೂಳು', isMutated: true },
            { text: 'ತಿಂದ್ದಿರಾ,', isMutated: true, note: 'Geminated dental past marker' },
            { text: 'ಚೋಲೋ', isMutated: true },
            { text: 'ಉಳ್ಳಿರಾ?', isMutated: true, note: 'Highland clipped bouncy cadence' },
          ],
        ],
        roman: [
          [
            { text: 'Neenu', isMutated: false },
            { text: 'ellige', isMutated: false },
            { text: 'hoguttiddiya?', isMutated: false },
            { text: 'Oota', isMutated: false },
            { text: 'chennagide', isMutated: false },
          ],
          [
            { text: 'Neevu', isMutated: true },
            { text: 'yettak', isMutated: true },
            { text: 'hogtiddira?', isMutated: false },
            { text: 'Koolu', isMutated: true },
            { text: 'cholo ide', isMutated: true },
          ],
          [
            { text: 'Neevu', isMutated: false },
            { text: 'yettak', isMutated: true },
            { text: 'hogde?', isMutated: true },
            { text: 'Koolu', isMutated: true },
            { text: 'cholo ulla', isMutated: true },
          ],
          [
            { text: 'Neevu', isMutated: false },
            { text: 'yettak', isMutated: true },
            { text: 'hogde?', isMutated: true },
            { text: 'Koolu', isMutated: true },
            { text: 'tindira,', isMutated: true },
            { text: 'cholo', isMutated: true },
            { text: 'ullira?', isMutated: true },
          ],
        ],
        rules: [
          'Canonical literary register baseline with standard unvoiced suffixes.',
          'Phonological glide shift: Interrogative fronting (ellige -> yettak) and koolu.',
          'Morphological contraction: Finite verb reduction (hoguttiddira -> hogde) + ulla.',
          'Acoustic accentuation: Bouncing mid-high melodic inflection with clipped terminals.',
        ],
      },
    };

    const targetKey = DIALECT_STAGES[regionCode] ? regionCode : 'hubballi_dharwad';
    const profile = DIALECT_STAGES[targetKey];

    const stageNames = [
      'STAGE 0 // STANDARD MYSURU BASELINE',
      'STAGE 1 // LEXICAL SUBSTRATE INGRESSION',
      'STAGE 2 // MORPHO-SYNTACTIC VERB MUTATION',
      'STAGE 3 // FULL CADENCE & TERMINAL HONORIFIC LOCK',
    ];

    return {
      tier,
      stageName: stageNames[tier],
      ruleExplanation: profile.rules[tier],
      kannadaTokens: profile.kannada[tier],
      romanTokens: profile.roman[tier],
    };
  };

  const activeCrossfade = getCrossfadeDisplay(crossfadeRegion, crossfadeValue);

  useEffect(() => {
    handleExecuteMorph(inputText, sourceLang);
  }, []);

  useEffect(() => {
    if (externalSeedPhrase && externalSeedPhrase !== inputText) {
      setInputText(externalSeedPhrase);
      const isKn = /[\u0C80-\u0CFF]/.test(externalSeedPhrase);
      const detectedLang = isKn ? 'kn' : 'en';
      setSourceLang(detectedLang);
      handleExecuteMorph(externalSeedPhrase, detectedLang);
    }
  }, [externalSeedPhrase]);

  const handleExecuteMorph = async (textToMorph: string, lang: 'en' | 'kn') => {
    if (!textToMorph.trim()) return;
    setIsLoading(true);
    try {
      const response = await swararekheApi.morphTranslate(textToMorph.trim(), lang, targetRegionFilter);
      setMorphData(response);
    } catch (err) {
      console.error('Morph translation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpand = (regionCode: string) => {
    setExpandedRegions((prev) => ({
      ...prev,
      [regionCode]: !prev[regionCode],
    }));
  };

  const handleOpenRulebook = async () => {
    setIsRulebookOpen(true);
    if (!rulebook) {
      const data = await swararekheApi.getMorphRules();
      if (data) setRulebook(data);
    }
  };

  const handlePlayCadence = (regionCode: string) => {
    setPlayingAudioRegion(regionCode);
    setAudioFeedback(`Acoustic Cadence: ${regionCode.replace('_', ' ')}`);

    const audioUrl = `/static/audio_samples/${regionCode}.wav`;
    const audio = new Audio(audioUrl);

    audio
      .play()
      .then(() => {
        audio.onended = () => {
          setPlayingAudioRegion(null);
          setAudioFeedback(null);
        };
      })
      .catch(() => {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          const pitches: Record<string, number> = {
            hubballi_dharwad: 155,
            kundapura_mangaluru: 178,
            kalaburagi_bidar: 138,
            arebhashe_kodagu: 182,
            bengaluru_mysuru: 168,
          };

          const baseF = pitches[regionCode] || 160;
          osc.frequency.setValueAtTime(baseF, audioCtx.currentTime);
          if (regionCode === 'hubballi_dharwad') {
            osc.frequency.linearRampToValueAtTime(baseF * 1.3, audioCtx.currentTime + 0.6);
          } else if (regionCode === 'kundapura_mangaluru') {
            osc.frequency.setValueAtTime(baseF * 1.15, audioCtx.currentTime + 0.2);
            osc.frequency.setValueAtTime(baseF * 0.9, audioCtx.currentTime + 0.4);
          } else {
            osc.frequency.linearRampToValueAtTime(baseF * 0.95, audioCtx.currentTime + 0.6);
          }

          gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.8);

          setTimeout(() => {
            setPlayingAudioRegion(null);
            setAudioFeedback(null);
          }, 850);
        } catch {
          setPlayingAudioRegion(null);
          setAudioFeedback(null);
        }
      });
  };

  const filteredResults =
    morphData?.results.filter((res) => {
      if (targetRegionFilter === 'all') return true;
      return res.region_code === targetRegionFilter;
    }) || [];

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (a.region_code === activeRegionCode) return -1;
    if (b.region_code === activeRegionCode) return 1;
    return 0;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Bay Header */}
      <div className="chassis-bay-header">
        <span className="bay-indicator">
          <span className="led-indicator active" />
          <span>BAY 01B</span>
        </span>
        <span>// NEURO-SYMBOLIC PHONOLOGICAL TRANSDUCTION TRAY</span>
      </div>

      {/* Input Console Deck with Generous 24px Padding & 28px Margin Bottom */}
      <div className="recessed-well" style={{ padding: '24px', marginBottom: '28px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteMorph(inputText, sourceLang);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
        >
          {/* Controls Bar: Source Mode Keys + Region Filter + Rulebook Trigger with 16px gap */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span className="meta-label" style={{ marginBottom: 0 }}>
                SOURCE REGISTER:
              </span>
              <button
                type="button"
                className={`raised-key ${sourceLang === 'en' ? 'active' : ''}`}
                onClick={() => setSourceLang('en')}
                style={{ fontSize: '13px', padding: '6px 14px', height: '32px' }}
              >
                <span className={`led-indicator ${sourceLang === 'en' ? 'active' : ''}`} />
                <span>ENGLISH (EN)</span>
              </button>
              <button
                type="button"
                className={`raised-key ${sourceLang === 'kn' ? 'active' : ''}`}
                onClick={() => setSourceLang('kn')}
                style={{ fontSize: '13px', padding: '6px 14px', height: '32px' }}
              >
                <span className={`led-indicator ${sourceLang === 'kn' ? 'active' : ''}`} />
                <span>ಕನ್ನಡ ಪ್ರಮಾಣ (KN)</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={14} color="var(--dp-color-label)" />
                <span className="meta-label" style={{ marginBottom: 0 }}>
                  SCOPE:
                </span>
                <select
                  value={targetRegionFilter}
                  onChange={(e) => setTargetRegionFilter(e.target.value)}
                  className="industrial-select"
                  style={{ height: '32px', padding: '4px 10px' }}
                >
                  <option value="all">COMPARE ALL 5 DIALECTS</option>
                  <option value="hubballi_dharwad">UTTARA KARNATAKA (DHARWAD)</option>
                  <option value="kundapura_mangaluru">KARAVALI (KUNDAPURA-MANGALURU)</option>
                  <option value="kalaburagi_bidar">KALYANA KARNATAKA (KALABURAGI)</option>
                  <option value="arebhashe_kodagu">MALNAD &amp; KODAGU (AREBHASHE)</option>
                  <option value="bengaluru_mysuru">OLD MYSURU (BENGALURU)</option>
                </select>
              </div>

              <button
                type="button"
                className="raised-key"
                onClick={handleOpenRulebook}
                title="Inspect the 5-Region Phonological Rulebook"
                style={{ fontSize: '13px', padding: '6px 14px', height: '32px' }}
              >
                <BookOpen size={14} color="var(--dp-color-ink)" />
                <span>RULEBOOK</span>
              </button>
            </div>
          </div>

          {/* Main Phrase Input Field (Height: 52px, Font: 18px) beside Primary MORPH Button (gap: 16px) */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                sourceLang === 'en'
                  ? "Enter colloquial phrase, e.g., 'Where are you going? Did you eat?'..."
                  : "ಕನ್ನಡ ವಾಕ್ಯ ನಮೂದಿಸಿ, e.g., 'ನೀವು ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀರಿ?'..."
              }
              className="industrial-input"
              style={{
                flex: 1,
                height: '52px',
                fontSize: '18px',
                padding: '0 18px',
              }}
            />

            <div className="tooltip-wrap">
              <button
                type="submit"
                disabled={isLoading}
                className="rotary-dial-btn"
                title="Trigger Neuro-Symbolic Phonological Morph"
                aria-label="Morph phrase across dialects"
              >
                <Sparkles size={20} color={isLoading ? 'var(--dp-color-accent)' : 'var(--dp-color-ink)'} />
              </button>
              <span className="tooltip-bubble">EXECUTE TRANSDUCTION</span>
            </div>
          </div>

          {/* Bank of Preset Prompt Keys in Spacious Flex Row (gap: 10px, margin-top: 16px, padding: 8px 14px) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginTop: '16px' }}>
            <span
              className="meta-label"
              style={{
                marginRight: '4px',
                marginBottom: 0,
              }}
            >
              PRESET KEYS:
            </span>
            {QUICK_PROMPT_KEYS.map((keyItem, idx) => (
              <button
                key={idx}
                type="button"
                className="raised-key"
                onClick={() => {
                  setInputText(keyItem.text);
                  setSourceLang(keyItem.lang);
                  handleExecuteMorph(keyItem.text, keyItem.lang);
                }}
                style={{ fontSize: '13px', padding: '8px 14px', height: '34px' }}
                title={`Load and morph: "${keyItem.text}"`}
              >
                <span>{keyItem.label}</span>
              </button>
            ))}
          </div>
        </form>

        {/* Matched Canonical Seed Telemetry */}
        {morphData?.matched_seed_concept && (
          <div
            className="recessed-field-screen"
            style={{
              marginTop: '16px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '12px',
            }}
          >
            <CheckCircle2 size={16} color="var(--dp-color-accent)" />
            <span>
              CANONICAL ANCHOR: <strong style={{ color: 'var(--dp-color-on-field)' }}>{morphData.matched_seed_concept}</strong>
            </span>
          </div>
        )}

        {audioFeedback && (
          <div
            style={{
              marginTop: '12px',
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '12px',
              color: 'var(--dp-color-accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Volume2 size={14} />
            <span>{audioFeedback}</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          ISOGLOSS CONTINUUM CROSSFADER DECK (Interactive Feature 2)
         ========================================================================= */}
      <div
        className="recessed-well"
        style={{
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* Header & Target Dialect Selector */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            borderBottom: '1px solid #9ba4a9',
            paddingBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={20} color="var(--dp-color-accent)" />
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--dp-color-ink)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              ISOGLOSS CONTINUUM CROSSFADER // TACTILE MORPH TRACK
            </span>
          </div>

          {/* Target Region Switcher Keys */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-label)', fontWeight: 600, marginRight: '4px' }}>
              TARGET CONTINUUM:
            </span>
            {[
              { code: 'hubballi_dharwad', label: 'DHARWAD' },
              { code: 'kundapura_mangaluru', label: 'KUNDAPURA' },
              { code: 'kalaburagi_bidar', label: 'KALABURAGI' },
              { code: 'arebhashe_kodagu', label: 'AREBHASHE' },
            ].map((reg) => (
              <button
                key={reg.code}
                type="button"
                className={`raised-key ${crossfadeRegion === reg.code ? 'active' : ''}`}
                onClick={() => {
                  hardwareSoundEngine.playKeyClick();
                  setCrossfadeRegion(reg.code);
                }}
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  height: '28px',
                  fontWeight: crossfadeRegion === reg.code ? 700 : 500,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{reg.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fader Track & Calibration Stops */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-label)', fontWeight: 600 }}>
              0% (STANDARD MYSURU)
            </span>
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '13px',
                fontWeight: 800,
                color: 'var(--dp-color-accent)',
                backgroundColor: 'var(--dp-color-field)',
                padding: '3px 12px',
                borderRadius: 'var(--dp-radius-key)',
                letterSpacing: '0.04em',
              }}
            >
              MORPH GRADIENT: {crossfadeValue}%
            </span>
            <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-label)', fontWeight: 600 }}>
              100% ({REGION_BADGES[crossfadeRegion]?.short?.toUpperCase() || 'TARGET'})
            </span>
          </div>

          {/* Native HTML Range with Industrial Hardware Styling */}
          <input
            type="range"
            min="0"
            max="100"
            value={crossfadeValue}
            onChange={handleCrossfadeChange}
            onMouseUp={handleCrossfadeRelease}
            onTouchEnd={handleCrossfadeRelease}
            style={{
              width: '100%',
              height: '10px',
              accentColor: 'var(--dp-color-accent)',
              cursor: 'ew-resize',
            }}
          />

          {/* 4 Calibration Stop Indicators */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '10px',
              color: 'var(--dp-color-label)',
              textAlign: 'center',
            }}
          >
            <div style={{ color: crossfadeValue <= 25 ? 'var(--dp-color-accent)' : undefined, fontWeight: crossfadeValue <= 25 ? 700 : 400 }}>
              ▲ 01 BASELINE (0-25%)
            </div>
            <div style={{ color: crossfadeValue > 25 && crossfadeValue <= 50 ? 'var(--dp-color-accent)' : undefined, fontWeight: crossfadeValue > 25 && crossfadeValue <= 50 ? 700 : 400 }}>
              ▲ 02 LEXICAL (26-50%)
            </div>
            <div style={{ color: crossfadeValue > 50 && crossfadeValue <= 75 ? 'var(--dp-color-accent)' : undefined, fontWeight: crossfadeValue > 50 && crossfadeValue <= 75 ? 700 : 400 }}>
              ▲ 03 VERB STEM (51-75%)
            </div>
            <div style={{ color: crossfadeValue > 75 ? 'var(--dp-color-accent)' : undefined, fontWeight: crossfadeValue > 75 ? 700 : 400 }}>
              ▲ 04 CADENCE (76-100%)
            </div>
          </div>
        </div>

        {/* Live Token Morph Display Screen */}
        <div
          className="recessed-field-screen"
          style={{
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            borderLeft: '4px solid var(--dp-color-accent)',
          }}
        >
          {/* Top Row: Tier badge on left, Audition button on right */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--dp-typography-mono)',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--dp-color-accent)',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span className="led-indicator active" />
              <span>{activeCrossfade.stageName}</span>
            </span>

            <button
              type="button"
              className="raised-key"
              onClick={() => handlePlayCadence(crossfadeRegion)}
              style={{ fontSize: '12px', height: '28px', padding: '4px 12px' }}
            >
              <Volume2 size={13} color="var(--dp-color-accent)" />
              <span>AUDITION CADENCE</span>
            </button>
          </div>

          {/* Center: Large animated Kannada (24px) with #f15b22 pill & Roman phonetics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', minHeight: '36px' }}>
              {activeCrossfade.kannadaTokens.map((tok, idx) => (
                <span
                  key={idx}
                  className="kannada-text"
                  style={{
                    fontSize: '24px',
                    fontWeight: tok.isMutated ? 800 : 600,
                    color: tok.isMutated ? '#ffffff' : 'var(--dp-color-on-field)',
                    backgroundColor: tok.isMutated ? '#f15b22' : 'transparent',
                    padding: tok.isMutated ? '2px 10px' : '0 2px',
                    borderRadius: tok.isMutated ? '4px' : '0',
                    border: tok.isMutated ? '1px solid #f15b22' : '1px solid transparent',
                    boxShadow: tok.isMutated ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                    transition: 'all 120ms ease',
                  }}
                  title={tok.note || undefined}
                >
                  {tok.text}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', fontFamily: 'var(--dp-typography-mono)', fontSize: '15px' }}>
              {activeCrossfade.romanTokens.map((tok, idx) => (
                <span
                  key={idx}
                  style={{
                    color: tok.isMutated ? '#f15b22' : 'var(--dp-color-on-field-muted)',
                    fontWeight: tok.isMutated ? 700 : 400,
                    backgroundColor: tok.isMutated ? 'rgba(241, 91, 34, 0.15)' : 'transparent',
                    padding: tok.isMutated ? '1px 6px' : '0',
                    borderRadius: '3px',
                  }}
                >
                  {tok.text}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom: Single-line concise rule explanation in muted monospace (13px) */}
          <div
            style={{
              paddingTop: '10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              fontFamily: 'var(--dp-typography-mono)',
              fontSize: '13px',
              color: 'var(--dp-color-on-field-muted)',
            }}
          >
            RULE APPLIED: <strong style={{ color: 'var(--dp-color-on-field)' }}>{activeCrossfade.ruleExplanation}</strong>
          </div>
        </div>
      </div>

      {/* Recessed Tray Holding the Regional Comparison Modules */}
      <div className="recessed-well" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--dp-typography-mono)',
            fontSize: '11px',
            color: 'var(--dp-color-label)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '0 4px',
          }}
        >
          <span>REGIONAL COMPARISON MODULES ({sortedResults.length} ZONES MOUNTED)</span>
          <span>STRESSED SYLLABLES HIGHLIGHTED IN ORANGE READOUT</span>
        </div>

        {/* 2-Column Responsive Card Grid with #1 Dominant Region Spanning Full Width */}
        <div className="morph-deck-grid">
          {sortedResults.map((result) => {
            const isSelected = result.region_code === activeRegionCode;
            const badge = REGION_BADGES[result.region_code] || {
              kannada: 'ಪ್ರಾದೇಶಿಕ',
              short: result.region_name,
            };
            const isExpanded = !!expandedRegions[result.region_code];
            const isPlaying = playingAudioRegion === result.region_code;

            return (
              <div
                key={result.region_code}
                className={`removable-module ${isSelected ? 'selected' : ''}`}
                style={{
                  padding: '20px 24px',
                  gridColumn: isSelected ? '1 / -1' : undefined,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* ROW 1: Card Header (Region Name + Kannada Badge left, CADENCE + DERIVATION right) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => onSelectRegion(result.region_code)}
                      className={`raised-key ${isSelected ? 'active' : ''}`}
                      style={{
                        fontSize: '14px',
                        padding: '6px 12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      title="Focus region on telemetry map"
                    >
                      <span className={`led-indicator ${isSelected ? 'active' : ''}`} />
                      <span style={{ fontWeight: 700 }}>{result.region_name}</span>
                    </button>

                    <span
                      className="kannada-text"
                      style={{
                        fontFamily: 'var(--dp-typography-kannada)',
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--dp-color-label)',
                        backgroundColor: 'var(--dp-color-well)',
                        padding: '3px 8px',
                        borderRadius: 'var(--dp-radius-key)',
                        border: '1px solid #9aa3a8',
                      }}
                    >
                      {badge.kannada}
                    </span>

                    <span
                      style={{
                        fontFamily: 'var(--dp-typography-mono)',
                        fontSize: '11px',
                        color: 'var(--dp-color-label)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {result.engine_mode === 'deterministic_symbolic' ? 'SYMBOLIC' : 'HYBRID LLM'}{' '}
                      [{Math.round(result.confidence_score * 100)}%]
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="raised-key"
                      onClick={() => handlePlayCadence(result.region_code)}
                      title={`Play synthetic audio cadence for ${result.region_name}`}
                      style={{ fontSize: '12px', padding: '6px 12px', height: '32px' }}
                    >
                      <Volume2 size={14} color={isPlaying ? 'var(--dp-color-accent)' : 'var(--dp-color-ink)'} />
                      <span>{isPlaying ? 'PLAYING...' : 'CADENCE'}</span>
                    </button>

                    <button
                      type="button"
                      className="raised-key"
                      onClick={() => handleToggleExpand(result.region_code)}
                      title="Toggle morphological derivation chain"
                      style={{
                        fontSize: '12px',
                        padding: '6px 12px',
                        height: '32px',
                        fontFamily: 'var(--dp-typography-mono)',
                        fontWeight: 600,
                      }}
                    >
                      {isExpanded ? (
                        <>
                          <Minus size={13} />
                          <span>HIDE</span>
                        </>
                      ) : (
                        <>
                          <Plus size={13} />
                          <span>+ DERIVATION</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* ROW 2: Card Body (Dark Recessed Screen with Kannada, Roman + IPA, and Syllable Stress) */}
                <div
                  className="recessed-field-screen"
                  style={{
                    backgroundColor: 'var(--dp-color-field)',
                    padding: '18px 20px',
                    marginTop: '12px',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {/* Large Kannada Script (26px, #f2f4f4) */}
                  <div
                    className="kannada-text"
                    style={{
                      fontSize: '26px',
                      fontWeight: 700,
                      color: '#f2f4f4',
                      lineHeight: '1.3',
                    }}
                  >
                    {result.morphed_kannada_script}
                  </div>

                  {/* Roman Phonetic (18px bold, #f15b22) + [IPA] (14px muted mono) */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'baseline',
                      gap: '8px',
                      wordBreak: 'break-word',
                      maxWidth: '100%',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--dp-typography-sans)',
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#f15b22',
                        wordBreak: 'break-word',
                      }}
                    >
                      {result.morphed_phonetic_roman}
                    </span>

                    <span
                      style={{
                        fontFamily: 'var(--dp-typography-mono)',
                        fontSize: '14px',
                        backgroundColor: 'rgba(0, 0, 0, 0.4)',
                        color: 'var(--dp-color-on-field-muted)',
                        padding: '2px 8px',
                        borderRadius: 'var(--dp-radius-key)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        wordBreak: 'break-all',
                        maxWidth: '100%',
                      }}
                    >
                      {result.ipa_approximation}
                    </span>
                  </div>

                  {/* Horizontal STRESS: Syllable Badges (gap: 6px) */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      alignItems: 'center',
                      fontFamily: 'var(--dp-typography-mono)',
                      fontSize: '12px',
                      marginTop: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--dp-color-on-field-muted)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      STRESS:
                    </span>
                    {result.syllable_stress_breakdown.split(/[\s-]+/).map((syl, sIdx) => {
                      const isStressed = syl === syl.toUpperCase() && syl.length > 1;
                      return (
                        <span
                          key={sIdx}
                          style={{
                            padding: '2px 7px',
                            borderRadius: '3px',
                            backgroundColor: isStressed ? 'rgba(241, 91, 34, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                            color: isStressed ? 'var(--dp-color-accent)' : 'var(--dp-color-on-field-muted)',
                            fontWeight: isStressed ? 700 : 400,
                            border: isStressed ? '1px solid var(--dp-color-accent)' : '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          {syl}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Collapsible Derivation Drawer (Only when + DERIVATION clicked) */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '14px',
                      paddingTop: '14px',
                      borderTop: '1px solid #cbd0d2',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* Cultural Context Field Note */}
                    <div
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        borderRadius: 'var(--dp-radius-key)',
                        borderLeft: '4px solid var(--dp-color-label)',
                        fontFamily: 'var(--dp-typography-sans)',
                        fontSize: '13px',
                        color: 'var(--dp-color-ink)',
                        lineHeight: 1.5,
                      }}
                    >
                      <strong>FIELD NOTE:</strong> {result.cultural_nuance_note}
                    </div>

                    {/* Morpheme Transduction Chain */}
                    <div
                      style={{
                        padding: '12px 14px',
                        backgroundColor: '#ffffff',
                        borderRadius: 'var(--dp-radius-key)',
                        border: '1px solid #b6bec2',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <span className="meta-label">MORPHEME TRANSDUCTION CHAIN:</span>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {result.word_by_word_diff.map((diff, dIdx) => (
                          <div
                            key={dIdx}
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 10px',
                              backgroundColor: 'var(--dp-color-raised)',
                              borderRadius: 'var(--dp-radius-key)',
                              fontSize: '12px',
                              fontFamily: 'var(--dp-typography-mono)',
                            }}
                          >
                            <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>
                              {diff.source_token}
                            </span>
                            <ArrowRight size={12} color="var(--dp-color-accent)" />
                            <span style={{ fontWeight: 700, color: 'var(--dp-color-accent)' }}>
                              {diff.target_token_roman}
                            </span>
                            <span className="kannada-text" style={{ fontWeight: 700 }}>
                              ({diff.target_token_script})
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                backgroundColor: '#ffffff',
                                padding: '2px 6px',
                                borderRadius: '2px',
                                border: '1px solid #b6bec2',
                                color: 'var(--dp-color-label)',
                              }}
                            >
                              [{diff.rule_applied}]
                            </span>
                            <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--dp-color-ink)' }}>
                              — {diff.explanation}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hardware Chassis Rulebook Modal */}
      {isRulebookOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(24, 30, 34, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
          }}
          onClick={() => setIsRulebookOpen(false)}
        >
          <div
            className="chassis-housing"
            style={{
              maxWidth: '920px',
              width: '100%',
              maxHeight: '88vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #9aa3a8',
                paddingBottom: '12px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BookOpen size={20} color="var(--dp-color-accent)" />
                <h3
                  style={{
                    fontSize: '22px',
                    margin: 0,
                    color: 'var(--dp-color-ink)',
                  }}
                >
                  5-REGION PHONOLOGICAL &amp; SUFFIX TRANSDUCTION RULEBOOK
                </h3>
              </div>
              <button
                type="button"
                className="raised-icon-key"
                onClick={() => setIsRulebookOpen(false)}
                style={{ width: '32px', height: '32px', padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Rulebook Content */}
            {!rulebook ? (
              <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--dp-typography-mono)', fontSize: '14px' }}>
                LOADING RULEBOOK FROM LINGUISTIC ENGINE...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(rulebook.rulebook).map(([code, profile]) => (
                  <div key={code} className="recessed-well" style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '18px', margin: 0 }}>
                        {profile.region_name} ({profile.kannada_name})
                      </h4>
                      <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '11px', color: 'var(--dp-color-label)' }}>
                        REGION_ID: {code}
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--dp-color-label)', marginBottom: '10px' }}>
                      Cadence: {profile.prosody_summary}
                    </p>

                    {/* Suffix rules */}
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '10px', color: 'var(--dp-color-accent)', fontWeight: 600 }}>
                        SUFFIX RULES:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        {profile.suffix_rules.map((rule, rIdx) => (
                          <div
                            key={rIdx}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #9aa3a8',
                              borderRadius: 'var(--dp-radius-key)',
                              padding: '3px 8px',
                              fontFamily: 'var(--dp-typography-mono)',
                              fontSize: '11px',
                            }}
                          >
                            <span>{rule.pattern}</span>
                            <span style={{ color: 'var(--dp-color-accent)', margin: '0 4px' }}>➔</span>
                            <strong>{rule.replacement}</strong>
                            <span style={{ color: 'var(--dp-color-label)', marginLeft: '4px' }}>({rule.description})</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lexical substitutions */}
                    <div>
                      <span style={{ fontFamily: 'var(--dp-typography-mono)', fontSize: '10px', color: 'var(--dp-color-label)', fontWeight: 600 }}>
                        LEXICAL SUBSTITUTIONS:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        {profile.lexical_substitutions.map((rule, rIdx) => (
                          <div
                            key={rIdx}
                            style={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #9aa3a8',
                              borderRadius: 'var(--dp-radius-key)',
                              padding: '3px 8px',
                              fontFamily: 'var(--dp-typography-mono)',
                              fontSize: '11px',
                            }}
                          >
                            <span>{rule.pattern}</span>
                            <span style={{ color: 'var(--dp-color-accent)', margin: '0 4px' }}>➔</span>
                            <strong>{rule.replacement}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default DialectMorphSheet;
