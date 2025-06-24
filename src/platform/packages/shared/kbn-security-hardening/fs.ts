/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { Buffer } from 'buffer';
import type { BinaryLike } from 'crypto';
import { createHash } from 'crypto';
import { existsSync, promises as fsp } from 'fs';
import { fs as memfs } from 'memfs';
import * as path from 'path';

import { REPO_ROOT } from '@kbn/repo-info';

const DATA_PATH = path.join(REPO_ROOT, 'data');

type VolumeType = 'disk' | 'memory';

interface FileMeta {
  path: string;
  volumeType: VolumeType;
  hash?: string;
}

const fileMeta = new Map<string, FileMeta>();
const sanitizeName = (name: string): string => path.basename(name);

const computeHash = (content: BinaryLike): string =>
  createHash('sha256').update(content).digest('hex');

// Inspired by node policies
const FS_POLICY = [
  {
    name: 'default',
    volume: DATA_PATH,
    allowedExtensions: ['.json', '.txt', '.yml', '.yaml', '.log', '.zip', '.gz'],
    maxSizeBytes: 1024 * 1024 * 10, // 10MB
  },
];

export async function saveFile(
  name: string,
  content: Parameters<typeof fsp.writeFile>[1],
  options: { persist?: boolean; override?: boolean } = {}
): Promise<{ alias: string; path: string }> {
  const { persist = true, override = false } = options;
  const volumeType: VolumeType = persist ? 'disk' : 'memory';
  const safeName = sanitizeName(name);
  const alias = `${volumeType}:${safeName}`;
  //   const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  //   const newHash = computeHash(buffer);

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

    if (volumeType === 'disk') {
      if (policy?.allowedExtensions?.includes(path.extname(safeName))) {
        throw new Error(`File "${name}" has an invalid extension.`);
      }

      if (policy?.maxSizeBytes && Buffer.byteLength(content) > policy.maxSizeBytes) {
        throw new Error(
          `File "${name}" exceeds the maximum allowed size of ${policy.maxSizeBytes} bytes.`
        );
      }

      await fsp.writeFile(existing.path, content);
    } else {
      // @ts-expect-error
      await memfs.promises.writeFile(existing.path, content);
    }

    return { alias, path: existing.path };
  }

  const filePath =
    volumeType === 'disk' ? path.join(DATA_PATH, safeName) : `/virtual/data/${safeName}`;

  if (volumeType === 'disk') {
    await fsp.writeFile(filePath, content);
  } else {
    await memfs.promises.mkdir(`/virtual/data`, { recursive: true });
    // @ts-expect-error fix types later
    await memfs.promises.writeFile(filePath, content);
  }

  fileMeta.set(alias, { path: filePath, volumeType });

  return { alias, path: filePath };
}

const getEntry = (name: string) => {
  const [diskAlias, memoryAlias] = ['disk', 'memory'].map((v) => `${v}:${name}`);
  let entry = fileMeta.get(diskAlias) || fileMeta.get(memoryAlias);

  if (!entry && existsSync(path.join(DATA_PATH, name))) {
    entry = { path: path.join(DATA_PATH, name), volumeType: 'disk' };
  }

  return entry;
};

export async function getFile(name: string): Promise<{ name: string; content: Buffer }> {
  const safeName = sanitizeName(name);
  const entry = getEntry(safeName);

  if (!entry) {
    throw new Error(`File "${name}" not found.`);
  }

  const content = await readFile(entry.path, entry.volumeType);

  // @ts-expect-error fix later
  return { name: safeName, content };
}

export async function deleteFile(name: string): Promise<void> {
  const safeName = sanitizeName(name);
  const entry = getEntry(safeName);

  if (!entry) {
    throw new Error(`File "${name}" not found.`);
  }

  if (entry.volumeType === 'disk') {
    await fsp.unlink(entry.path);
  } else {
    await memfs.promises.unlink(entry.path);
  }

  fileMeta.delete(`${entry.volumeType}:${safeName}`);
}

async function readFile(filePath: string, volumeType: VolumeType): ReturnType<typeof fsp.readFile> {
  return volumeType === 'disk' ? fsp.readFile(filePath) : memfs.promises.readFile(filePath);
}
