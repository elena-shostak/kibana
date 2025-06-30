/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { Buffer } from 'buffer';
import { existsSync } from 'fs';
import * as path from 'path';

import { REPO_ROOT } from '@kbn/repo-info';

import { FileRepository } from './fs-repository';

const DATA_PATH = path.join(REPO_ROOT, 'data');

type VolumeType = 'disk' | 'memory';

interface FileMeta {
  path: string;
  volumeType: VolumeType;
  volume?: string;
  hash?: string;
}

const fileMeta = new Map<string, FileMeta>();
const sanitizeName = (name: string): string => {
  // TODO perform validations
  return path.basename(name);
};

// Inspired by node policies
const FS_POLICY = [
  {
    name: 'default',
    volumes: [DATA_PATH, '/virtual/data'],
    allowedExtensions: ['.json', '.txt', '.yml', '.yaml', '.log', '.zip', '.gz'],
    maxSizeBytes: 1024 * 1024 * 10, // 10MB
  },
];

type FileContent = string | NodeJS.ArrayBufferView;

interface WriteFileOptions {
  /**
   * When true, allows overwriting an existing file at the same path.
   * @default false
   */
  override?: boolean;
  /**
   * Defines the storage.
   * `true`: Saves the file to the disk.
   * `false`: Saves the file to an in-memory filesystem.
   * @default true
   */
  persist?: boolean;

  /**
   * Specifies a sub-directory (sub-volume) within the base data directory
   * to help in organizing files, e.g., 'reports', 'exports'.
   */
  volume?: string;
}

interface FileMetadata {
  /**
   * A unique identifier for the file, combining volume type and sanitized name.
   * e.g., 'disk:reports/my-report.csv'
   */
  alias: string;

  /**
   * The full path to the file, either on disk or in the virtual filesystem.
   */
  path: string;
}

const getFileAlias = (name: string, volumeType: VolumeType, volume?: string) => {
  return `${volumeType}:${volume ? `${volume}/` : ''}${name}`;
};

export async function writeFile(
  name: string,
  content: FileContent,
  options?: WriteFileOptions
): Promise<FileMetadata> {
  const { persist = true, override = false, volume } = options ?? {};
  const volumeType: VolumeType = persist ? 'disk' : 'memory';
  const repository = FileRepository.from(volumeType);

  const safeName = sanitizeName(name);
  const alias = getFileAlias(safeName, volumeType, volume);
  const existing = fileMeta.get(alias);
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

    if (policy?.allowedExtensions?.includes(path.extname(safeName))) {
      throw new Error(`File "${name}" has an invalid extension.`);
    }

    if (policy?.maxSizeBytes && Buffer.byteLength(content) > policy.maxSizeBytes) {
      throw new Error(
        `File "${name}" exceeds the maximum allowed size of ${policy.maxSizeBytes} bytes.`
      );
    }

    repository.writeFile(existing.path, content);

    return { alias, path: existing.path };
  }

  let volumePath = repository.basePath;

  if (volume && !repository.volumeExists(volume)) {
    await repository.createVolume(volume);
    volumePath = path.join(volumePath, volume);
  }

  const filePath = path.join(volumePath, safeName);

  await repository.writeFile(filePath, content);

  fileMeta.set(alias, { path: filePath, volumeType, volume });

  return { alias, path: filePath };
}

const getEntry = (name: string, volume?: string) => {
  const [diskAlias, memoryAlias] = ['disk', 'memory'].map((vType) =>
    getFileAlias(name, vType as VolumeType, volume)
  );
  let entry = fileMeta.get(diskAlias) || fileMeta.get(memoryAlias);

  const filePath = path.join(DATA_PATH, volume ?? '', name);

  if (!entry && existsSync(filePath)) {
    entry = { path: filePath, volumeType: 'disk', volume };
  }

  return entry;
};

export async function readFile(
  name: string,
  volume?: string
): Promise<{ name: string; content: FileContent }> {
  const safeName = sanitizeName(name);
  const entry = getEntry(safeName, volume);

  if (!entry) {
    throw new Error(`File "${name}" not found.`);
  }

  const repository = FileRepository.from(entry.volumeType);

  const content = await repository.readFile(entry.path);

  return { name: safeName, content };
}

export async function deleteFile(name: string, volume?: string): Promise<void> {
  const safeName = sanitizeName(name);
  const entry = getEntry(safeName, volume);

  if (!entry) {
    throw new Error(`File "${name}" not found.`);
  }
  const alias = getFileAlias(safeName, entry.volumeType, entry.volume);
  const repository = FileRepository.from(entry.volumeType);

  await repository.unlink(entry.path);
  fileMeta.delete(alias);
}
