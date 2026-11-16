import { storeConfig } from "@/lib/config";
import { uz } from "./uz";
import { copy as uzInterface } from "./interface";

// Add each new locale here. Components consume this resolver, not locale files.
const dictionaries = {
  "uz-UZ": { messages: uz, copy: uzInterface },
} as const;

export const { messages, copy } = dictionaries[storeConfig.locale];
