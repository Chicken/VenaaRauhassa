export type HUE = { h: number; s: number; l: number };

export function rgbHexToHSL(hex: string): HUE {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else if (max === b) h = (r - g) / d + 4;

    h /= 6;
  }

  return { h: h * 360, s, l };
}

export function hslToRgbHex(hsl: HUE): string {
  const c = (1 - Math.abs(2 * hsl.l - 1)) * hsl.s;
  const x = c * (1 - Math.abs(((hsl.h / 60) % 2) - 1));
  const m = hsl.l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hsl.h >= 0 && hsl.h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (hsl.h >= 60 && hsl.h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (hsl.h >= 120 && hsl.h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (hsl.h >= 180 && hsl.h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (hsl.h >= 240 && hsl.h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (hsl.h >= 300 && hsl.h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b
    .toString(16)
    .padStart(2, "0")}`;
}

export function hueShift(hex: string, hueAmount: number): string {
  const hsl = rgbHexToHSL(hex);
  hsl.h += hueAmount;
  if (hsl.h > 360) hsl.h -= 360;
  else if (hsl.h < 0) hsl.h += 360;
  return hslToRgbHex(hsl);
}
