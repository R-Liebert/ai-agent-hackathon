/**
 * Utility functions for converting persona configuration values between
 * string representations (used in UI) and numeric values (used by backend)
 */

/**
 * Converts interaction style string to numeric value for backend
 */
export const interactionStyleToNumber = (style: string | number): number => {
  // If already a number, return it
  if (typeof style === 'number') return style;
  
  switch (style.toLowerCase()) {
    case "casual": return 1;
    case "confident": return 2;
    case "enthusiastic": return 3;
    case "default": 
    default: return 0;
  }
};

/**
 * Converts interaction style numeric value from backend to string for UI
 */
export const interactionStyleToString = (style: string | number | undefined): string => {
  if (style === undefined || style === null) return "Default";
  
  // If already a string, return it with proper casing
  if (typeof style === 'string') {
    const lower = style.toLowerCase();
    if (lower === "casual") return "Casual";
    if (lower === "confident") return "Confident";
    if (lower === "enthusiastic") return "Enthusiastic";
    return "Default";
  }
  
  // Convert number to string
  switch (style) {
    case 1: return "Casual";
    case 2: return "Confident";
    case 3: return "Enthusiastic";
    case 0:
    default: return "Default";
  }
};

/**
 * Converts detail level string to numeric value for backend
 */
export const detailLevelToNumber = (level: string | number): number => {
  // If already a number, return it
  if (typeof level === 'number') return level;
  
  switch (level.toLowerCase()) {
    case "concise": return 1;
    case "long": return 2;
    case "default":
    default: return 0;
  }
};

/**
 * Converts detail level numeric value from backend to string for UI
 */
export const detailLevelToString = (level: string | number | undefined): string => {
  if (level === undefined || level === null) return "Default";
  
  // If already a string, return it with proper casing
  if (typeof level === 'string') {
    const lower = level.toLowerCase();
    if (lower === "concise") return "Concise";
    if (lower === "long") return "Long";
    return "Default";
  }
  
  // Convert number to string
  switch (level) {
    case 1: return "Concise";
    case 2: return "Long";
    case 0:
    default: return "Default";
  }
};

/**
 * Converts a persona object from UI format (strings) to backend format (numbers)
 */
export const convertPersonaToBackend = (persona: any) => {
  if (!persona) return persona;
  
  return {
    ...persona,
    interactionStyle: interactionStyleToNumber(persona.interactionStyle),
    detailLevel: detailLevelToNumber(persona.detailLevel)
  };
};

/**
 * Converts a persona object from backend format (numbers) to UI format (strings)
 */
export const convertPersonaToUI = (persona: any) => {
  if (!persona) return persona;
  
  return {
    ...persona,
    interactionStyle: interactionStyleToString(persona.interactionStyle),
    detailLevel: detailLevelToString(persona.detailLevel)
  };
};