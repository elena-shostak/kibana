/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { existsSync } from 'fs';
import fsp from 'fs/promises';
import * as path from 'path';
import { REPO_ROOT } from '@kbn/repo-info';
import type { Readable, Writable } from 'stream';
import type {
  WriteFileOptions,
  FileMetadata,
  ISafeFs,
  FileRegistryEntry,
  VolumeType,
  FileContent,
} from './types';

// For demo purposes, defining a simple policy here.
const FS_POLICY = [
  {
    name: 'default',
    volumes: [path.join(REPO_ROOT, 'data')],
    allowedExtensions: ['.json', '.txt', '.yml', '.yaml', '.log', '.zip', '.gz'],
    maxSizeBytes: 1024 * 1024 * 10, // 10MB
  },
];

export class SafeFS implements ISafeFs {
  private readonly DATA_PATH: string;
  private readonly fileMeta: Map<string, FileRegistryEntry>;

  constructor(basePath?: string) {
    this.DATA_PATH = basePath || path.join(REPO_ROOT, 'data');
    this.fileMeta = new Map<string, FileRegistryEntry>();
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
    return existsSync(volumePath);
  }

  private async createVolume(volumePath: string): Promise<void> {
    await fsp.mkdir(volumePath, { recursive: true });
  }

  async writeFile(
    name: string,
    content: FileContent,
    options?: WriteFileOptions
  ): Promise<FileMetadata> {
    const { override = false, volume } = options ?? {};
    const volumeType = 'disk';

    const safeName = this.sanitizeName(name);
    const alias = this.getFileAlias(safeName, volumeType, volume);
    const existing = this.fileMeta.get(alias);
    // Policies for different volumes can be further extended
    const policy = FS_POLICY.find((p) => p.name === 'default');

    if (existing) {
      if (!override) {
        throw new Error(`File "${name}" already exists in ${volumeType} with different content.`);
      }
      // Perform validations
      // 1. Path Traversal
      // 2. MIME type validation
      // 3. File size validation
      // 4. File type validation
      // 5. File content validation

      if (!policy?.allowedExtensions?.includes(path.extname(safeName))) {
        throw new Error(`File "${name}" has an invalid extension.`);
      }

      if (policy?.maxSizeBytes && Buffer.byteLength(content) > policy.maxSizeBytes) {
        throw new Error(
          `File "${name}" exceeds the maximum allowed size of ${policy.maxSizeBytes} bytes.`
        );
      }

      await fsp.writeFile(existing.path, content);

      return { alias, path: existing.path };
    }

    const volumePath = path.join(this.DATA_PATH, volume ?? '');

    if (volume && !this.volumeExists(volume)) {
      await this.createVolume(volumePath);
    }

    const filePath = path.join(volumePath, safeName);

    await fsp.writeFile(filePath, content);

    this.fileMeta.set(alias, { path: filePath, volumeType, volume });

    return { alias, path: filePath };
  }

  async readFile(name: string, volume?: string): Promise<string | Buffer> {
    const safeName = this.sanitizeName(name);
    const filePath = this.getFilePath(safeName, volume);
    const content = await fsp.readFile(filePath);

    return content;
  }

  async deleteFile(name: string, volume?: string): Promise<void> {
    const safeName = this.sanitizeName(name);
    const filePath = this.getFilePath(safeName, volume);
    const alias = this.getFileAlias(safeName, 'disk', volume);
    await fsp.unlink(filePath);

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
export default new SafeFS();
