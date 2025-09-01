/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import * as path from 'path';
import safeFs from './fs';

// Mock modules
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue(Buffer.from('mock content')),
  unlink: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({ isFile: () => true }),
}));

jest.mock('@kbn/repo-info', () => ({
  REPO_ROOT: '/mock/repo/root',
}));

describe('SafeFS', () => {
  const mockDataPath = '/mock/repo/root/data';
  let mockFs: any;
  let mockFsp: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Import mocked modules
    mockFs = require('fs');
    mockFsp = require('fs/promises');
  });

  describe('writeFile', () => {
    it('should write a file successfully', async () => {
      const name = 'test.json';
      const content = JSON.stringify({ test: 'data' });
      const volume = 'reports';

      const result = await safeFs.writeFile(name, content, { volume });

      expect(result).toEqual({
        alias: expect.stringContaining(`disk:${volume}/${name}`),
        path: expect.stringContaining(path.join(mockDataPath, volume, name)),
      });
      expect(mockFsp.writeFile).toHaveBeenCalled();
    });

    it('should throw an error when trying to overwrite without override flag', async () => {
      // Setup the file registry to simulate an existing file
      await safeFs.writeFile('existing.json', '{}', { volume: 'reports' });

      // Now try to write to the same file without override
      await expect(
        safeFs.writeFile('existing.json', 'new content', { volume: 'reports' })
      ).rejects.toThrow(/already exists/);
    });

    it('should allow overwriting when override flag is true', async () => {
      const result = await safeFs.writeFile('existing.json', 'new content', {
        volume: 'reports',
        override: true,
      });

      expect(result).toEqual({
        alias: expect.stringContaining('disk:reports/existing.json'),
        path: expect.stringContaining(path.join(mockDataPath, 'reports', 'existing.json')),
      });
    });
  });

  describe('readFile', () => {
    it('should read a file successfully', async () => {
      const name = 'test_read.json';
      const volume = 'reports';
      const mockContent = JSON.stringify({ test: 'data' });

      // Setup file to read
      await safeFs.writeFile(name, mockContent, { volume });

      // Mock readFile for this specific test
      mockFsp.readFile.mockResolvedValueOnce(Buffer.from(mockContent));

      const result = await safeFs.readFile(name, volume);

      expect(result).toEqual(Buffer.from(mockContent));
      expect(mockFsp.readFile).toHaveBeenCalledWith(path.join(mockDataPath, volume, name));
    });
  });

  describe('deleteFile', () => {
    it('should delete a file successfully', async () => {
      const name = 'test_delete.json';
      const volume = 'reports';
      const mockContent = JSON.stringify({ test: 'data' });

      // Setup file to delete
      await safeFs.writeFile(name, mockContent, { volume });

      await safeFs.deleteFile(name, volume);

      expect(mockFsp.unlink).toHaveBeenCalledWith(
        expect.stringContaining(path.join(mockDataPath, volume, name))
      );
    });
  });
});
