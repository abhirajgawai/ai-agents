import { writeFile, mkdir } from "fs/promises";
import { dirname } from "path";

export const saveNoteSchema = {
  name: "save_note",
  description:
    "Saves research findings or notes to a markdown file on disk. Use this when you have gathered enough information and want to save a summary or report.",
  input_schema: {
    type: "object" as const,
    properties: {
      filename: {
        type: "string",
        description:
          "The filename to save to, e.g. 'research/ai-frameworks.md'",
      },
      content: {
        type: "string",
        description: "The markdown content to write to the file.",
      },
    },
    required: ["filename", "content"],
  },
};

export async function saveNote(
  filename: string,
  content: string,
): Promise<string> {
  await mkdir(dirname(filename), { recursive: true });
  await writeFile(filename, content, "utf-8");
  return `Saved to ${filename}`;
}
