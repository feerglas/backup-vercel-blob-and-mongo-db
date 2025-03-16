import {
  list,
  del,
  put,
} from "@vercel/blob";

export const addBlob = async (file, content) => {
  await put(
    file,
    content,
    {
      access: 'public',
      addRandomSuffix: false,
    }
  );
}

export const deleteAllBlobs = async () => {
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

export const getAllBlobs = async () => {
  let cursor;
  let results = [];

  do {
    const listResult = await list({
      cursor,
      limit: 250,
    });

    if (listResult.blobs.length > 0) {
      results = results.concat(listResult.blobs);
    }

    cursor = listResult.cursor;
  } while (cursor);

  return results;
}