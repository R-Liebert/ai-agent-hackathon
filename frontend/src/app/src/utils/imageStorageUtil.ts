import localforage from "localforage";

export type LocalStorageItem = {
  data: string;
  fileName: string;
  contentType: string;
  svg: boolean;
};

const imageStore = localforage.createInstance({
  name: "imageStorage",
  version: 3,
});

// In-memory cache
const memoryCache = new Map<string, LocalStorageItem>();
let isCacheInitialized = false;

const initializeCache = async (): Promise<void> => {
  if (isCacheInitialized) return;

  try {
    const keys = await imageStore.keys();
    const itemPromises = keys.map(async (key) => {
      if (!memoryCache.has(key)) {
        const item = await imageStore.getItem<LocalStorageItem>(key);
        if (item) memoryCache.set(key, item);
      }
    });

    await Promise.all(itemPromises);
    isCacheInitialized = true;
    console.log("Cache initialized.");
  } catch (error) {
    console.error("Error initializing cache:", error);
  }
};

export const save = async (key: string, value: LocalStorageItem): Promise<void> => {
  try {
    memoryCache.set(key, value);
    await imageStore.setItem(key, value);
    console.log(`Item saved with key: ${key}`);
  } catch (error) {
    console.error("Error saving item:", error);
  }
};

export const get = async (key: string): Promise<LocalStorageItem | null> => {
  await initializeCache();

  if (memoryCache.has(key)) {
    console.log(`Item retrieved from cache with key: ${key}`);
    return memoryCache.get(key) || null;
  }

  try {
    const item = await imageStore.getItem<LocalStorageItem>(key);
    if (item) {
      memoryCache.set(key, item);
      console.log(`Item retrieved from storage with key: ${key}`);
      return item;
    }
    console.warn(`No item found for key: ${key}`);
    return null;
  } catch (error) {
    console.error("Error retrieving item:", error);
    return null;
  }
};

export const remove = async (key: string): Promise<void> => {
  memoryCache.delete(key);
  try {
    await imageStore.removeItem(key);
    console.log(`Item removed with key: ${key}`);
  } catch (error) {
    console.error("Error removing item:", error);
  }
};

export const clearAll = async (): Promise<void> => {
  memoryCache.clear();
  try {
    await imageStore.clear();
    console.log("All items have been cleared.");
  } catch (error) {
    console.error("Error clearing items:", error);
  }
};

const imageStorageUtil = {
  save,
  get,
  remove,
  clearAll,
};

initializeCache();

export default imageStorageUtil;
