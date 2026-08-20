import { LocalStorageService } from "./LocalStorageService.js";
import type { StorageService } from "./StorageService.js";

export const storageService: StorageService = new LocalStorageService();

export type { StorageService };