export const hexToRgb = (hex: string) => {
  hex = hex.replace("#", "");

  if (hex.length === 3) {
    hex = hex.split("").map(c => c + c).join("");
  }

  const num = parseInt(hex, 16);

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};


export const rgbToHsv = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;

  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
  }

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : d / max;
  const v = max;

  return { h, s: s * 100, v: v * 100 };
};

export const hsvToMatter = (h: number, s: number) => {
  return {
    hue: Math.round((h / 360) * 254),
    saturation: Math.round((s / 100) * 254),
  };
};

export const hexToMatterHS = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const { h, s } = rgbToHsv(r, g, b);
  return hsvToMatter(h, s);
};