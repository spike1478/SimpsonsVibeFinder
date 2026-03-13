import type { ToneBuckets } from '../types';

export interface ToneKeywords {
  [key: string]: string[];
}

export const toneKeywords: ToneKeywords = {
  cosy: [
    'home', 'family', 'comfort', 'warm', 'cozy', 'domestic', 'everyday', 'routine',
    'dinner', 'couch', 'relax', 'peaceful', 'quiet', 'simple', 'normal',
    'springfield', 'house', 'living room', 'kitchen', 'bedtime', 'breakfast'
  ],
  laughOutLoud: [
    'funny', 'hilarious', 'comedy', 'joke', 'laugh', 'humor', 'comic', 'gag',
    'prank', 'silly', 'absurd', 'ridiculous', 'wacky', 'zany',
    'bart', 'homer', 'marge', 'lisa', 'maggie', 'krusty', 'comedy', 'gag'
  ],
  cleverSatire: [
    'satire', 'parody', 'mock', 'critique', 'social commentary', 'political',
    'irony', 'sarcasm', 'wit', 'clever', 'smart', 'intelligent', 'subversive',
    'media', 'television', 'celebrity', 'culture',
    'springfield', 'nuclear', 'power plant', 'school', 'education', 'government',
    'mayor quimby', 'burns', 'kent brockman', 'news', 'television show'
  ],
  chaotic: [
    'chaos', 'chaotic', 'unhinged', 'crazy', 'wild', 'insane', 'madness',
    'disaster', 'mayhem', 'trouble', 'mischief', 'out of control', 'explosive',
    'destructive', 'rampage',
    'homer', 'bart', 'nuclear', 'explosion', 'accident', 'disaster', 'emergency'
  ],
  wholesome: [
    'heartwarming', 'touching', 'emotional', 'sweet', 'kind', 'caring',
    'love', 'friendship', 'bond', 'family', 'together', 'support', 'help',
    'generous', 'selfless', 'tender', 'gentle',
    'marge', 'lisa', 'maggie', 'family', 'parent', 'child', 'relationship',
    'springfield', 'community', 'neighbor', 'friend'
  ],
  cynical: [
    'cynical', 'dark', 'bleak', 'pessimistic', 'bitter', 'jaded', 'sarcastic',
    'harsh', 'cruel', 'mean', 'nasty', 'vicious', 'twisted', 'grim', 'depressing',
    'burns', 'smithers', 'corporate', 'greed', 'corruption', 'power', 'money'
  ],
};

export const knownClipShowTitles = [
  'so it\'s come to this',
  'the simpsons 138th episode spectacular',
  'the simpsons 138th episode',
  'another simpsons clip show',
  'the simpsons clip show',
  'so it\'s come to this: a simpsons clip show',
];

export const clipShowKeywords = [
  'clip show', 'flashback', 'remember when', 'reminisce', 'recollection',
  'look back', 'nostalgia', 'memories', 'past episodes', 'greatest hits'
];

export const halloweenPatterns = [
  'treehouse of horror',
  'tree house of horror',
  'halloween',
  'trick or treat',
];

export const christmasKeywords = [
  'christmas', 'xmas', 'holiday', 'santa', 'present', 'gift', 'snow',
  'winter', 'december', 'nativity'
];

// Scoring weights
export const SCORING_WEIGHTS = {
  quizToneWeight: 0.9,
  popularityWeight: 0.1,
  tieBreakerThreshold: 0.05,
};

// Energy level mappings to tone buckets
export const energyToTones: Record<string, (keyof ToneBuckets)[]> = {
  chill: ['cosy', 'wholesome'],
  medium: ['laughOutLoud', 'cleverSatire'],
  high: ['chaotic', 'laughOutLoud'],
};


