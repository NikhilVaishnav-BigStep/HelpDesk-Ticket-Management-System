import { Readable } from "stream";

export interface StorageService {
    save(
        key: string,
        data: Buffer | Readable,
        contentType?: string,
    ): Promise<void>;
    get(key: string): Promise<Readable>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
}