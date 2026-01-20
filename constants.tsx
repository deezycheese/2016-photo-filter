
import { CameraFilter } from './types';

export const FILTERS: CameraFilter[] = [
  {
    id: 'solaris',
    name: 'SOLARIS',
    css: 'contrast(1.1) brightness(1.1) saturate(1.6) sepia(0.15) hue-rotate(-10deg)',
    description: 'Classic retro sunset look. Golden highlights, vibrant teals, and deep purple-tinted shadows.'
  },
  {
    id: 'vapor',
    name: 'VAPOR',
    css: 'contrast(1.2) brightness(1.05) saturate(1.8) hue-rotate(280deg) sepia(0.1)',
    description: 'Neon-infused aesthetic with heavy pink and purple bias. Dreamy and nostalgic.'
  },
  {
    id: 'overexposed',
    name: 'GLOW',
    css: 'contrast(0.9) brightness(1.3) saturate(1.4) sepia(0.2) blur(0.5px)',
    description: 'High-key exposure with soft-focus blooming and vintage light leaks.'
  },
  {
    id: 'chrome-plus',
    name: 'CHROME+',
    css: 'contrast(1.3) brightness(1) saturate(2) hue-rotate(-5deg)',
    description: 'Ultra-vibrant color science inspired by early 2000s high-end point-and-shoots.'
  },
  {
    id: 'twilight',
    name: 'TWILIT',
    css: 'contrast(1.1) brightness(0.9) saturate(1.5) hue-rotate(20deg) sepia(0.3)',
    description: 'Deep amber tones and warm color temperature for that perpetual golden hour.'
  },
  {
    id: 'none',
    name: 'RAW',
    css: 'contrast(1) brightness(1) saturate(1)',
    description: 'Unprocessed sensor data.'
  }
];

export const VINTAGE_GRAIN_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
  <filter id='noiseFilter'>
    <feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#noiseFilter)' opacity='0.12'/>
</svg>
`;
