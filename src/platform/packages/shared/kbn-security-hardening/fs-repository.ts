/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { MakeDirectoryOptions, Mode } from 'fs';
import { existsSync } from 'fs';
import fsp from 'fs/promises';
import { fs as memfs } from 'memfs';
import * as path from 'path';

type VolumeType = 'disk' | 'memory';

type FileContent = string | NodeJS.ArrayBufferView;

import { REPO_ROOT } from '@kbn/repo-info';

const DATA_PATH = path.join(REPO_ROOT, 'data');

export class FileRepository {
  private fs: typeof fsp | typeof memfs.promises;
  public basePath: string;

  static from(volumeType: VolumeType): FileRepository {
    return new FileRepository(volumeType);
  }

  constructor(private volumeType: VolumeType) {
    this.fs = volumeType === 'disk' ? fsp : memfs.promises;
    this.basePath = volumeType === 'disk' ? DATA_PATH : '/virtual/data';

    if (!this.exists(this.basePath)) {
      this.mkdir(this.basePath, { recursive: true });
    }
  }

  async writeFile(
    filePath: string,
    content: FileContent,
    options?: {
      mode?: Mode;
      flag?: string;
      flush?: boolean;
    }
  ): Promise<void> {
    return this.fs.writeFile(filePath, content, options);
  }

  async mkdir(dirPath: string, options: MakeDirectoryOptions): Promise<void> {
    const { recursive, ...rest } = options;

    this.fs.mkdir(dirPath, { recursive: true, ...rest });
  }

  async readFile(...args: Parameters<typeof fsp.readFile>): ReturnType<typeof fsp.readFile> {
    // @ts-expect-error fix types later
    return this.fs.readFile(...args);
  }

  async unlink(filePath: string): Promise<void> {
    return this.fs.unlink(filePath);
  }

  exists(filePath: string): boolean {
    return this.volumeType === 'disk' ? existsSync(filePath) : memfs.existsSync(filePath);
  }

  volumeExists(volume: string): boolean {
    const volumePath = path.join(this.basePath, volume);

    return this.volumeType === 'disk' ? existsSync(volumePath) : memfs.existsSync(volumePath);
  }

  async createVolume(volume: string): Promise<void> {
    const volumePath = path.join(this.basePath, volume);

    await this.mkdir(volumePath, { recursive: true });
  }
}
