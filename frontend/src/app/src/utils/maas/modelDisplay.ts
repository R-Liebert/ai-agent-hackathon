import type { Model } from "../../types/maasTypes";

export default function getModelDisplayName(model: Model): string {
  const trimmedName = model.name?.trim();
  if (trimmedName && trimmedName.length > 0) {
    return trimmedName;
  }
  return model.key.replace(/-/g, " ");
}
