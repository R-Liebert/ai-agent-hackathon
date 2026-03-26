export const sanitizeHTML = (html: string): string => {
  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Replace <br> tags with plain text line breaks
  const sanitizedText = tempDiv.innerHTML.replace(/<br\s*\/?>/gi, "\n");

  // Strip all remaining HTML tags
  return sanitizedText.replace(/<\/?[^>]+(>|$)/g, "");
};
