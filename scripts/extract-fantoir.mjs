import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, "../src/data/FANTOIR0722");
const outPath = path.join(__dirname, "../prisma/seed-data/french-streets.json");

const streets = new Set();

const rl = readline.createInterface({
  input: fs.createReadStream(filePath, { encoding: "latin1" }),
  crlfDelay: Infinity,
});

const TYPE_LABELS = {
  "RUE ": "RUE",
  "AV  ": "AVENUE",
  "ALL ": "ALLEE",
  "IMP ": "IMPASSE",
  "CHE ": "CHEMIN",
  "PL  ": "PLACE",
  "RTE ": "ROUTE",
  "SQ  ": "SQUARE",
  "VLA ": "VILLA",
  "CRS ": "COURS",
  "RPT ": "ROND-POINT",
  "QUA ": "QUAI",
  "PASS": "PASSAGE",
  "SENT": "SENTIER",
  "CHAU": "CHAUSSEE",
  "CITE": "CITE",
  "VILL": "VILLA",
};

let lineCount = 0;

rl.on("line", (line) => {
  lineCount++;
  if (streets.size >= 2000) return;
  if (lineCount % 150 !== 0) return;
  if (line.length < 41) return;
  if (!/^\d/.test(line)) return;
  const voieId = line.substring(6, 10);
  if (voieId.trim() === "") return;
  const typeVoie = line.substring(11, 15);
  const fullType = TYPE_LABELS[typeVoie];
  if (!fullType) return;
  const name = line.substring(15, 41).trim();
  if (name.length > 1) streets.add(`${fullType} ${name}`);
});

rl.on("close", () => {
  const arr = Array.from(streets);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(arr, null, 2), "utf-8");
  console.log(`Extracted ${arr.length} unique street names → prisma/seed-data/french-streets.json`);
  console.log("Sample:", arr.slice(0, 10));
});
