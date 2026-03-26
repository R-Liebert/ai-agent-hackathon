/**
 * Utility functions for determining which tools are available for different models and chat types
 */

/**
 * Determines which tools should be enabled based on the selected model and chat type
 *
 * @param model - The currently selected model
 * @param chatType - The current chat type
 * @returns Array of enabled tool identifiers
 */
export const getEnabledTools = (model: string, chatType: string): string[] => {
  const enabledTools: string[] = [];

  if (supportsImageGeneration(model, chatType)) {
    enabledTools.push("image-generation");
  }

  if (supportsImageVision(model, chatType)) {
    enabledTools.push("image-vision");
  }

  return enabledTools;
};

/**
 * Generates metadata for the enabled tools
 *
 * @param enabledTools - Array of enabled tool identifiers
 * @param imageGenerationEnabled - Whether image generation is specifically enabled for this request
 * @returns Metadata object for the request
 *
 * Note: Image generation intent is now signaled via top-level `imageGenerationForced` flag.
 * The backend owns the system message and tool policy - no instructionsOverride needed.
 */
export const getToolsMetadata = (
  enabledTools: string[],
  imageGenerationEnabled: boolean = false
): Record<string, string> => {
  const metadata: Record<string, string> = {};

  // Image generation intent is now handled by the backend via the top-level
  // imageGenerationForced flag. No instructionsOverride is needed.
  // The backend will inject the appropriate directive into the system message.

  return metadata;
};

/**
 * Checks if the model and chat type combination supports image generation
 */
const supportsImageGeneration = (model: string, chatType: string): boolean => {
  // Models that support image generation - now all models support it
  const imageGenModels = ["GPT-4o", "GPT-5 mini", "GPT-5.1"];

  // Chat types that can use image generation
  const imageGenChatTypes = ["Normal", "Workspace"];

  return imageGenModels.includes(model) && imageGenChatTypes.includes(chatType);
};

/**
 * Checks if the model and chat type combination supports image vision
 */
const supportsImageVision = (model: string, chatType: string): boolean => {
  // Models that support image vision - now all models support it
  const imageVisionModels = ["GPT-4o", "GPT-5 mini", "GPT-5.1"];

  // Chat types that can use image vision
  const imageVisionChatTypes = ["Normal", "Workspace"];

  return (
    imageVisionModels.includes(model) && imageVisionChatTypes.includes(chatType)
  );
};
