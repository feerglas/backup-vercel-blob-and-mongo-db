import {
  list,
  del,
  put,
} from "@vercel/blob";

import type { ListBlobResultBlob } from "@vercel/blob";

export const addBlob = async (file: string, content: string): Promise<void> => {
  await put(
    file,
    content,
    {
      access: 'public',
      addRandomSuffix: false,
    }
  );
}

export const deleteAllBlobs = async (): Promise<void> => {
  let cursor;

  do {
    const listResult = await list({
      cursor,
      limit: 1000,
    });

    if (listResult.blobs.length > 0) {
      await del(listResult.blobs.map((blob) => blob.url));
    }

    cursor = listResult.cursor;
  } while (cursor);

}

export const getAllBlobs = async (): Promise<[(ListBlobResultBlob | undefined)?]> => {
  let cursor;
  const results: [ListBlobResultBlob?] = [];

  do {
    const listResult = await list({
      cursor,
      limit: 250,
    });

    if (listResult.blobs.length > 0) {
      results.push(...listResult.blobs);
    }

    cursor = listResult.cursor;
  } while (cursor);

  return results;
}