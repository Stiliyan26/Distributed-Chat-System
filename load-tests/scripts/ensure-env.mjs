import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const fullFilePath = import.meta.url; //"file:///Users/bogdan/projects/Chat-System/load-tests/scripts/ensure-env.mjs"
const filePathWithoutFilePrefix = fileURLToPath(fullFilePath); // "/Users/stiliyan26/projects/Chat-System/load-tests/scripts/ensure-env.mjs"
const parentDirectoryOfTheFilePath = path.dirname(filePathWithoutFilePrefix); // "/Users/stiliyan26/projects/Chat-System/load-tests/scripts"
const parentFolderOfTheFileParentFolder = path.join(
  parentDirectoryOfTheFilePath,
  "..",
); // "/Users/stiliyan26/projects/Chat-System/load-tests"

const envPath = path.join(parentFolderOfTheFileParentFolder, ".env");
const examplePath = path.join(
  parentFolderOfTheFileParentFolder,
  ".env.example",
);

if (!existsSync(examplePath)) {
  console.error("Missing .env.example");
  process.exit(1);
}

if (!existsSync(envPath)) {
  copyFileSync(examplePath, envPath);
  console.log("Created load-tests/.env from .env.example");
} else {
  console.log("load-tests/.env already exists (left unchanged)");
}
