import { describe, expect, it } from 'vitest';
import { extractJsSrcOrder, validateJsOrder } from '../scripts/build-utils.mjs';

describe('build-utils', () => {
  const expectedOrder = [
    'src/js/main.js',
    'src/js/components.js',
    'src/js/projectiles-effects.js',
    'src/js/starship.js',
    'src/js/scenes.js',
    'src/js/game-loop.js',
  ];

  it('extracts js script order from html', () => {
    const html = `
      <script src="src/js/main.js"></script>
      <script src="src/js/components.js"></script>
      <script src="src/js/projectiles-effects.js"></script>
      <script src="src/js/starship.js"></script>
      <script src="src/js/scenes.js"></script>
      <script src="src/js/game-loop.js"></script>
    `;
    expect(extractJsSrcOrder(html)).toEqual(expectedOrder);
  });

  it('passes when order matches expected', () => {
    const html = `
      <script src="src/js/main.js"></script>
      <script src="src/js/components.js"></script>
      <script src="src/js/projectiles-effects.js"></script>
      <script src="src/js/starship.js"></script>
      <script src="src/js/scenes.js"></script>
      <script src="src/js/game-loop.js"></script>
    `;
    expect(() => validateJsOrder(html, expectedOrder)).not.toThrow();
  });

  it('fails when order is broken', () => {
    const html = `
      <script src="src/js/main.js"></script>
      <script src="src/js/components.js"></script>
      <script src="src/js/projectiles-effects.js"></script>
      <script src="src/js/scenes.js"></script>
      <script src="src/js/starship.js"></script>
      <script src="src/js/game-loop.js"></script>
    `;
    expect(() => validateJsOrder(html, expectedOrder)).toThrow(/order mismatch/i);
  });

  it('fails when script count is wrong', () => {
    const html = `
      <script src="src/js/main.js"></script>
      <script src="src/js/components.js"></script>
      <script src="src/js/projectiles-effects.js"></script>
      <script src="src/js/starship.js"></script>
      <script src="src/js/scenes.js"></script>
    `;
    expect(() => validateJsOrder(html, expectedOrder)).toThrow(/count mismatch/i);
  });
});
