import { ChatModel } from "./chat-model";

export type ModelIconType =
  | "bolt"
  | "sparkles"
  | "robot"
  | "rocket"
  | "lightbulb"
  | "chatBubble";

export interface ModelMetadata {
  key: string;
  description: string;
  defaultModel: boolean;
  name: string;
  supportsFiles: boolean;
  supportsDocuments: boolean;
  supportsImages: boolean;
  supportsTools: boolean;
  isReasoningModel: boolean;
  iconType: ModelIconType;
}

export const MODELS: Record<string, ModelMetadata> = {
  "GPT-4o": {
    key: "GPT-4o",
    description: "Responds immediately. Optimized for speed.",
    name: "Fast Response",
    defaultModel: true,
    supportsFiles: true,
    supportsDocuments: true,
    supportsImages: true,
    supportsTools: true,
    isReasoningModel: false,
    iconType: "sparkles",
  },
  "GPT-5.1": {
    key: "GPT-5.1",
    description: "Thinks longer to deliver better answers.",
    name: "Deep Reflection",
    defaultModel: false,
    supportsFiles: true,
    supportsDocuments: true,
    supportsImages: true,
    supportsTools: true,
    isReasoningModel: true,
    iconType: "rocket",
  },
};

export const getModelSupportsFiles = (modelKey: string): boolean => {
  return MODELS[modelKey]?.supportsFiles ?? false;
};

export const getModelSupportsTools = (modelKey: string): boolean => {
  return MODELS[modelKey]?.supportsTools ?? false;
};

export const getModelSupportsDocuments = (modelKey: string): boolean => {
  return MODELS[modelKey]?.supportsDocuments ?? false;
};

export const getModelSupportsImages = (modelKey: string): boolean => {
  return MODELS[modelKey]?.supportsImages ?? false;
};

export const getModelIsReasoningModel = (modelKey: string): boolean => {
  return MODELS[modelKey]?.isReasoningModel ?? false;
};

export const getModelIconType = (modelKey: string): ModelIconType => {
  return MODELS[modelKey]?.iconType ?? "lightbulb";
};

export const getModelsAsArray = (): ModelMetadata[] => {
  return Object.values(MODELS);
};

// Utility to create ChatModel instances from the metadata
export const getModelsForSelector = (): ChatModel[] => {
  return getModelsAsArray().map(
    (model) =>
      new ChatModel(
        model.key,
        model.description,
        model.defaultModel,
        model.name
      )
  );
};
