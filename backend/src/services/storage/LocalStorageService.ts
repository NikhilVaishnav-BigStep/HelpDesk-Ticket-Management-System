import { promises as fs, createReadStream, createWriteStream } from "fs";
import path from "path";
import { Readable } from "stream";
import type { StorageService } from "./StorageService.js";

const ROOT_DIR = path.resolve(process.cwd(), "attachments");

const ensureDir = async (dir: string): Promise<void> => {
    await fs.mkdir(dir, { recursive: true });
};

export class LocalStorageService implements StorageService {
    private rootDir: string;

    constructor(rootDir: string = ROOT_DIR) {
        this.rootDir = rootDir;
    }

    private resolvePath(key: string): string {
        const sanitized = key.replace(/\.\./g, "").replace(/^\/+/, "");
        return path.join(this.rootDir, sanitized);
    }

    async save(
        key: string,
        data: Buffer | Readable,
        _contentType?: string,
    ): Promise<void> {
        void _contentType;
        const targetPath = this.resolvePath(key);
        const targetDir = path.dirname(targetPath);
        await ensureDir(targetDir);

        if (Buffer.isBuffer(data)) {
            await fs.writeFile(targetPath, data);
            return;
        }

        return new Promise((resolve, reject) => {
            const writeStream = createWriteStream(targetPath);
            data.pipe(writeStream);
            writeStream.on("finish", resolve);
            writeStream.on("error", reject);
        });
    }

    async get(key: string): Promise<Readable> {
        const targetPath = this.resolvePath(key);
        return createReadStream(targetPath);
    }

    async delete(key: string): Promise<void> {
        const targetPath = this.resolvePath(key);
        await fs.unlink(targetPath);
    }

    async exists(key: string): Promise<boolean> {
        const targetPath = this.resolvePath(key);
        try {
            await fs.access(targetPath);
            return true;
        } catch {
            return false;
        }
    }
}