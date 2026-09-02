import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Database } from "@/domain/types";
import { emptyDatabase, type Repository } from "./repository";

export class JsonRepository implements Repository {
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async transaction<T>(operation: (database: Database) => T | Promise<T>): Promise<T> {
    let release!: () => void;
    const previous = this.queue;
    this.queue = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      const database = await this.read();
      const result = await operation(database);
      await this.write(database);
      return result;
    } finally {
      release();
    }
  }

  private async read(): Promise<Database> {
    try {
      return JSON.parse(await readFile(this.filePath, "utf8")) as Database;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyDatabase();
      throw error;
    }
  }

  private async write(database: Database): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(database, null, 2), "utf8");
    await rename(temporary, this.filePath);
  }
}
