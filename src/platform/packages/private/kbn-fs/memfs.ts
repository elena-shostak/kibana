/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { fs as memfs } from 'memfs';
import type { Readable, Writable } from 'stream';
import * as path from 'path';
import type {
  WriteFileOptions,
  FileMetadata,
  ISafeFs,
  FileContent,
  VolumeType,
  FileRegistryEntry,
} from './types';

class SafeMemFS implements ISafeFs {
  private readonly DATA_PATH: string;
  private readonly fileMeta: Map<string, FileRegistryEntry>;

  constructor(basePath?: string) {
    this.DATA_PATH = basePath || 'virtual/data';
    this.fileMeta = new Map<string, FileRegistryEntry>();

    // Ensure the base directory exists
    if (!memfs.existsSync(this.DATA_PATH)) {
      memfs.mkdirSync(this.DATA_PATH, { recursive: true });
    }
  }

  private sanitizeName(name: string): string {
    // TODO perform validations
    return path.basename(name);
  }

  private getFileAlias(name: string, volumeType: VolumeType, volume?: string): string {
    return `${volumeType}:${volume ? `${volume}/` : ''}${name}`;
  }

  private getFilePath(name: string, volume?: string): string {
    if (!volume) {
      return path.join(this.DATA_PATH, name);
    }

    return path.join(this.DATA_PATH, volume, name);
  }

  private volumeExists(volume: string): boolean {
    const volumePath = path.join(this.DATA_PATH, volume);
    return memfs.existsSync(volumePath);
  }

  private async createVolume(volumePath: string): Promise<void> {
    await memfs.promises.mkdir(volumePath, { recursive: true });
  }

  async writeFile(
    name: string,
    content: FileContent,
    options?: WriteFileOptions
  ): Promise<FileMetadata> {
    const { override = false, volume } = options ?? {};
    const volumeType = 'memory';

    const safeName = this.sanitizeName(name);
    const alias = this.getFileAlias(safeName, volumeType, volume);
    const existing = this.fileMeta.get(alias);

    if (existing) {
      if (!override) {
        throw new Error(`File "${name}" already exists in ${volumeType} with different content.`);
      }

      await memfs.promises.writeFile(existing.path, content);

      return { alias, path: existing.path };
    }

    const volumePath = path.join(this.DATA_PATH, volume ?? '');

    if (volume && !this.volumeExists(volume)) {
      await this.createVolume(volumePath);
    }

    const filePath = this.getFilePath(safeName, volume);

    await memfs.promises.writeFile(filePath, content);

    this.fileMeta.set(alias, { path: filePath, volumeType, volume });

    return { alias, path: filePath };
  }

  async readFile(name: string, volume?: string): Promise<string | Buffer> {
    const safeName = this.sanitizeName(name);
    const filePath = this.getFilePath(safeName, volume);
    const content = await memfs.promises.readFile(filePath);

    return content;
  }

  async deleteFile(name: string, volume?: string): Promise<void> {
    const safeName = this.sanitizeName(name);
    const filePath = this.getFilePath(safeName, volume);
    const alias = this.getFileAlias(safeName, 'memory', volume);
    await memfs.promises.unlink(filePath);
    this.fileMeta.delete(alias);
  }

  appendFile(): Promise<FileMetadata> {
    throw new Error('Method not implemented.');
  }

  createWriteStream(): Writable {
    throw new Error('Method not implemented.');
  }

  createReadStream(): Readable {
    throw new Error('Method not implemented.');
  }

  exists(name: string, volume?: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}

// eslint-disable-next-line import/no-default-export
export default new SafeMemFS();
