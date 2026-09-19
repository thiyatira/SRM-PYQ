import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const dataDir = path.join(projectRoot, "public", "data");
const outDir = path.join(projectRoot, "src", "data");
const outFile = path.join(outDir, "subjectFiles.json");

function scanFiles() {
  if (!fs.existsSync(dataDir)) {
    console.error(`Data directory not found at: ${dataDir}`);
    process.exit(1);
  }

  const result = {};
  const entries = fs.readdirSync(dataDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subjectDir = path.join(dataDir, entry.name);
      const files = fs
        .readdirSync(subjectDir)
        .filter((file) => file.endsWith(".json") && file.toLowerCase() !== "manifest.json")
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

      result[entry.name] = files;
    }
  }

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outFile, JSON.stringify(result, null, 2), "utf-8");
  console.log(`Successfully scanned ${Object.keys(result).length} subject folders -> ${outFile}`);
}

scanFiles();
