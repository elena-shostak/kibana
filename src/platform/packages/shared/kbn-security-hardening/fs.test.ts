/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */
import { deleteFile, getFile, saveFile } from './fs';

describe('safe-fs', () => {
  afterAll(() => {
    deleteFile('test.json');
    deleteFile('disk.txt');
    deleteFile('conflict.txt');
  });

  it('saves and retrieves a file in memory', async () => {
    await saveFile('test.json', '{"ok":true}');
    const file = await getFile('test.json');
    expect(file.name).toBe('test.json');
    expect(file.content.toString()).toBe('{"ok":true}');
  });

  it('saves and retrieves a file on disk', async () => {
    await saveFile('disk.txt', 'Hello Disk', { persist: true });
    const file = await getFile('disk.txt');
    expect(file.content.toString()).toBe('Hello Disk');
  });

  it('prevents saving a file with same name without override', async () => {
    await saveFile('conflict.txt', 'One');
    await expect(saveFile('conflict.txt', 'Two')).rejects.toThrow(/already exists/);
  });

  it('deletes a file from memory', async () => {
    await saveFile('delete-me.json', '{"x":1}');
    await deleteFile('delete-me.json');
    await expect(getFile('delete-me.json')).rejects.toThrow(/not found/);
  });
});
