import * as lancedb from "@lancedb/lancedb";
import { embed } from "./embeddings.js";

const DB_PATH = ".lancedb";
const TABLE_NAME = "documents";

async function getTable(db: lancedb.Connection) {
  const names = await db.tableNames();
  if (names.includes(TABLE_NAME)) {
    return db.openTable(TABLE_NAME);
  }
  return db.createTable(TABLE_NAME, [
    { text: "__init__", vector: Array(768).fill(0), source: "" },
  ]);
}

export async function addChunks(
  chunks: string[],
  source: string,
): Promise<void> {
  const db = await lancedb.connect(DB_PATH);
  const table = await getTable(db);

  const rows = await Promise.all(
    chunks.map(async (text) => ({
      text,
      vector: await embed(text),
      source,
    })),
  );

  await table.add(rows);
  console.log(`Stored ${rows.length} chunks from "${source}"`);
}

export async function search(
  query: string,
  limit = 5,
): Promise<{ text: string; source: string }[]> {
  const db = await lancedb.connect(DB_PATH);
  const table = await getTable(db);

  const queryVector = await embed(query);
  const results = await table
    .search(queryVector)
    .where("text != '__init__'")
    .limit(limit)
    .toArray();

  return results.map((r) => ({
    text: r.text as string,
    source: r.source as string,
  }));
}
