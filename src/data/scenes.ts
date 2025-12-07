import type { Scene } from '../types';

/**
 * Hamza Labs Forge Video - 8 Scenes
 * Epic blacksmith forge video revealing the Hamza Labs emblem
 */
export const HAMZA_LABS_SCENES: Scene[] = [
  {
    id: 1,
    name: 'The Forge',
    startPrompt:
      'Ancient blacksmith forge interior shrouded in darkness, barely visible shapes, single distant ember glowing faintly, deep shadows, mysterious atmosphere, cinematic lighting, photorealistic, 4K',
    endPrompt:
      'Blacksmith forge interior fully lit by roaring flames, glowing hot embers and coals piled high, ancient stone furnace with fire blazing, dark atmospheric workshop, anvil in foreground, tongs and hammers on wall, orange and gold firelight illuminating the space, smoke rising, dramatic shadows, cinematic, photorealistic, 4K',
    motionPrompt:
      'Slow camera push forward, flames gradually igniting, light building, embers beginning to glow',
    duration: 5,
  },
  {
    id: 2,
    name: 'Molten Gold Pouring',
    startPrompt:
      'Close-up of crucible tilting, first drop of molten liquid gold about to fall, glowing bright orange-gold, intense heat visible, dark forge background, dramatic anticipation, cinematic, photorealistic, 4K',
    endPrompt:
      'Molten liquid gold pouring in steady stream from crucible into curved sword-shaped mold, glowing bright orange-gold metal filling the shape, sparks flying on contact, extreme heat glow, dark forge background, dramatic lighting, close-up, photorealistic, 4K',
    motionPrompt:
      'Crucible tilting smoothly, liquid gold pouring steadily, sparks on contact, heat distortion',
    duration: 5,
  },
  {
    id: 3,
    name: 'Blade Forming',
    startPrompt:
      'Overhead view of sword mold filled with glowing molten gold, liquid metal settling, bright orange surface, dark edges of mold visible, heat radiating, steam wisps starting, cinematic, photorealistic, 4K',
    endPrompt:
      'Curved scimitar blade emerging from mold, glowing hot golden metal solidifying, perfect shamshir curve taking shape, steam rising around the blade, surface beginning to cool with golden sheen, dark workshop background, scattered embers floating, dramatic orange lighting, cinematic close-up, photorealistic, 4K',
    motionPrompt:
      'Gold solidifying, steam rising, blade shape emerging, surface cooling to golden sheen',
    duration: 5,
  },
  {
    id: 4,
    name: 'Sparks Flying',
    startPrompt:
      'Glowing golden scimitar blade placed on dark anvil, hammer raised above, moment of anticipation before strike, forge fire in background, dramatic tension, cinematic, photorealistic, 4K',
    endPrompt:
      'Hammer striking hot golden scimitar blade on anvil, massive shower of bright sparks exploding outward in all directions, frozen motion blur on sparks, blade being shaped, blacksmith forge glowing behind, dark background contrasting with brilliant spark explosion, cinematic lighting, action shot, photorealistic, 4K',
    motionPrompt:
      'Hammer striking down, sparks exploding outward, dramatic action, blade ringing',
    duration: 5,
  },
  {
    id: 5,
    name: 'Arabic Engraving',
    startPrompt:
      'Extreme close-up of smooth golden sword blade surface, polished but still warm, faint heat glow, dark background, moment of stillness before the burn, cinematic detail, photorealistic, 4K',
    endPrompt:
      'Extreme close-up of golden sword blade, Arabic word "حمزة" fully burned into the hot metal, glowing orange letters seared deep into gold surface, intricate calligraphy details visible, thin smoke wisping from fresh engraving, scattered embers floating past, dark background, dramatic lighting, cinematic, photorealistic, 4K',
    motionPrompt:
      'Arabic letters burning into metal one stroke at a time, smoke wisping, glow intensifying',
    duration: 5,
  },
  {
    id: 6,
    name: 'Helmet Rises',
    startPrompt:
      'Roaring flames filling the frame, dark silhouette of pointed shape barely visible within the fire, mysterious form, anticipation, intense orange and gold fire, dark background, cinematic, photorealistic, 4K',
    endPrompt:
      'Islamic warrior helmet with pointed dome risen fully from flames, golden metal glowing brilliantly, intricate engravings visible on surface, chainmail aventail flowing beneath like liquid gold, fire and smoke swirling around the helmet, embers floating upward, dark forge background, epic dramatic emergence, cinematic, photorealistic, 4K',
    motionPrompt:
      'Helmet rising majestically through flames, fire parting, chainmail flowing, dramatic emergence',
    duration: 5,
  },
  {
    id: 7,
    name: 'Smoke Clearing',
    startPrompt:
      'Golden helmet and scimitar swords completely shrouded in thick white steam and dark smoke, only faint golden glows visible through the haze, shapes obscured, mysterious atmosphere, dark background, cinematic, photorealistic, 4K',
    endPrompt:
      'Steam and smoke clearing to reveal golden helmet and two scimitar swords, details emerging through thinning haze, ornate patterns becoming visible, soft golden glow through white wisps, composition taking final form, dark atmospheric background, dramatic reveal moment, cinematic lighting, photorealistic, 4K',
    motionPrompt:
      'Smoke slowly clearing, details emerging, golden light breaking through haze, reveal building',
    duration: 5,
  },
  {
    id: 8,
    name: 'Final Reveal',
    startPrompt:
      'Full emblem slightly obscured, soft focus, golden helmet and swords visible but not sharp, black leather background emerging, frame beginning to form, anticipation of final reveal, cinematic soft focus, photorealistic, 4K',
    endPrompt:
      'Luxury emblem fully revealed in perfect clarity, Islamic warrior helmet with pointed dome and flowing chainmail centered, two curved scimitar swords positioned vertically on each side, ornate shield frame surrounding the composition, intricate Islamic geometric patterns in background, Arabic "حمزة" engraved on helmet band, gold arabesque border complete, "HAMZA LABS" on elegant banner ribbon below, royal gold metallic with realistic reflections, deep black leather textured background, dramatic spotlight from above, premium tech company crest, perfectly symmetric, regal, highly detailed, photorealistic, 4K',
    motionPrompt:
      'Focus sharpening, spotlight intensifying, final details crystallizing, emblem fully revealed',
    duration: 5,
  },
];

/**
 * Calculate total video duration including transitions
 */
export function calculateTotalDuration(scenes: Scene[], transitionDuration = 0.5): number {
  const totalSceneDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const totalTransitionOverlap = (scenes.length - 1) * transitionDuration;
  return totalSceneDuration - totalTransitionOverlap;
}

/**
 * Get scene by ID
 */
export function getSceneById(scenes: Scene[], id: number): Scene | undefined {
  return scenes.find((scene) => scene.id === id);
}
