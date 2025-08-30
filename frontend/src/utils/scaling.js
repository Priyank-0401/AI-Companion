/**
 * Scaling utilities for consistent rem-based sizing
 * Converts your 80% zoom designs to proper rem units
 */

// Base conversion factor (your designs were at 80% zoom)
const SCALE_FACTOR = 0.8;
const BASE_FONT_SIZE = 16; // 16px base font size

/**
 * Convert pixel values to rem with 0.8x scaling factor
 * @param {number} px - Pixel value from your original design
 * @returns {string} - rem value as string
 */
export const pxToRem = (px) => {
  const scaledPx = px * SCALE_FACTOR;
  const remValue = scaledPx / BASE_FONT_SIZE;
  return `${remValue}rem`;
};

/**
 * Convert multiple pixel values to rem (useful for spacing arrays)
 * @param {number[]} pxArray - Array of pixel values
 * @returns {string[]} - Array of rem values as strings
 */
export const pxArrayToRem = (pxArray) => {
  return pxArray.map(px => pxToRem(px));
};

/**
 * Generate responsive spacing object for Tailwind
 * @param {number} basePx - Base pixel value
 * @returns {object} - Responsive spacing object
 */
export const responsiveSpacing = (basePx) => ({
  sm: pxToRem(basePx * 0.75),
  md: pxToRem(basePx),
  lg: pxToRem(basePx * 1.25),
  xl: pxToRem(basePx * 1.5),
});

/**
 * Common scaled values for quick reference
 */
export const scaledSizes = {
  // Typography
  text: {
    xs: pxToRem(12),     // 0.6rem
    sm: pxToRem(14),     // 0.7rem
    base: pxToRem(16),   // 0.8rem
    lg: pxToRem(18),     // 0.9rem
    xl: pxToRem(20),     // 1rem
    '2xl': pxToRem(24),  // 1.2rem
    '3xl': pxToRem(30),  // 1.5rem
    '4xl': pxToRem(36),  // 1.8rem
  },
  
  // Common spacing
  spacing: {
    xs: pxToRem(4),      // 0.2rem
    sm: pxToRem(8),      // 0.4rem
    md: pxToRem(16),     // 0.8rem
    lg: pxToRem(24),     // 1.2rem
    xl: pxToRem(32),     // 1.6rem
    '2xl': pxToRem(48),  // 2.4rem
    '3xl': pxToRem(64),  // 3.2rem
  },
  
  // Component sizes
  components: {
    button: {
      sm: { padding: `${pxToRem(6)} ${pxToRem(12)}`, fontSize: pxToRem(14) },
      md: { padding: `${pxToRem(10)} ${pxToRem(20)}`, fontSize: pxToRem(16) },
      lg: { padding: `${pxToRem(12)} ${pxToRem(24)}`, fontSize: pxToRem(18) },
    },
    input: {
      sm: { padding: `${pxToRem(6)} ${pxToRem(12)}`, fontSize: pxToRem(14) },
      md: { padding: `${pxToRem(10)} ${pxToRem(16)}`, fontSize: pxToRem(16) },
      lg: { padding: `${pxToRem(12)} ${pxToRem(20)}`, fontSize: pxToRem(18) },
    },
  },
};

/**
 * CSS-in-JS helper for inline styles
 * @param {object} styles - Object with px values
 * @returns {object} - Object with converted rem values
 */
export const scaleStyles = (styles) => {
  const scaledStyles = {};
  
  for (const [key, value] of Object.entries(styles)) {
    if (typeof value === 'number') {
      scaledStyles[key] = pxToRem(value);
    } else if (typeof value === 'string' && value.includes('px')) {
      // Handle string values like "10px 20px"
      scaledStyles[key] = value.replace(/(\d+)px/g, (match, px) => pxToRem(parseInt(px)));
    } else {
      scaledStyles[key] = value;
    }
  }
  
  return scaledStyles;
};

/**
 * Breakpoint helpers for responsive design
 */
export const breakpoints = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

/**
 * Media query helper
 * @param {string} breakpoint - Breakpoint key
 * @returns {string} - Media query string
 */
export const mediaQuery = (breakpoint) => `@media (min-width: ${breakpoints[breakpoint]})`;
