/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { Writable, Readable, StreamOptions } from 'stream';

export type FileContent = string | NodeJS.ArrayBufferView;
export interface WriteFileOptions {
  // When true, allows overwriting an existing file at the same path.
  override?: boolean;

  // Specifies a sub-directory (sub-volume) within the base data directory to help in organizing files, e.g., 'reports', 'exports'.
  volume?: string;
}

export interface FileMetadata {
  // A unique identifier for the file, combining volume type and sanitized name. e.g., 'disk:reports/my-report.csv'
  alias: string;
  // The full path to the file, either on disk or in the virtual filesystem.
  path: string;
}

export type VolumeType = 'disk' | 'memory';

export interface FileRegistryEntry {
  path: string;
  volumeType: VolumeType;
  volume?: string;
  hash?: string;
}

export interface ISafeFs {
  // Writes data to a file, replacing the file if `override` is true.
  writeFile(name: string, content: FileContent, options?: WriteFileOptions): Promise<FileMetadata>;
  // Appends data to a file, creating the file if it does not yet exist.
  appendFile(name: string, content: FileContent, options?: WriteFileOptions): Promise<FileMetadata>;

  // Reads the entire contents of a file.
  readFile(name: string, volume?: string): Promise<Buffer | string>;

  // Creates a Readable stream from a file.
  createReadStream(
    name: string,
    volume?: string,
    options?: BufferEncoding | StreamOptions<Readable>
  ): Readable;

  createWriteStream(
    name: string,
    volume?: string,
    options?: BufferEncoding | StreamOptions<Writable>
  ): Writable;

  // Deletes a file.
  deleteFile(name: string, volume?: string): Promise<void>;
  // Checks if a file exists within the specified volume.
  exists(name: string, volume?: string): Promise<boolean>;
}
