export const generateHighContrastColor = (): string => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }

  const r = parseInt(color.substring(1, 3), 16);
  const g = parseInt(color.substring(3, 5), 16);
  const b = parseInt(color.substring(5, 7), 16);

  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

  if (luminance > 200) {
    return generateHighContrastColor();
  }

  return color;
};
