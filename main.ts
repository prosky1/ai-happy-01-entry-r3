// ai-happy-01 round 3 entry: "A baby's first puppy lick".
// Node 22, stdlib only, no network. Copies the bundled entry image to
// the grader's output directory after validating it against the
// competition gate (format, size, dimensions), then self-checks that the
// written file is byte-identical to the bundled one.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1_048_576;
const MAX_SIDE = 1024;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);

function fail(message) {
  console.error(`gate failed: ${message}`);
  process.exit(1);
}

function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

// Width/height of a PNG from its IHDR chunk (bytes 16..24).
function pngDimensions(bytes) {
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

// Width/height of a JPEG by walking its markers until a SOF frame.
function jpegDimensions(bytes) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) fail("jpeg marker expected");
    const marker = bytes[offset + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
    }
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  fail("no jpeg SOF frame found");
}

function detectFormat(bytes) {
  if (bytes.subarray(0, 8).equals(PNG_MAGIC)) return { kind: "png", dimensions: pngDimensions(bytes) };
  if (bytes.subarray(0, 3).equals(JPEG_MAGIC)) return { kind: "jpeg", dimensions: jpegDimensions(bytes) };
  fail("entry is neither PNG nor JPEG");
}

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, "entry.png");
if (!existsSync(sourcePath)) fail("entry.png missing next to main.ts");

const sourceBytes = readFileSync(sourcePath);
const format = detectFormat(sourceBytes);
if (sourceBytes.length > MAX_BYTES) {
  fail(`entry is ${sourceBytes.length} bytes, over the ${MAX_BYTES} byte cap`);
}
if (format.dimensions.width > MAX_SIDE || format.dimensions.height > MAX_SIDE) {
  fail(`entry is ${format.dimensions.width}x${format.dimensions.height}, over the ${MAX_SIDE}x${MAX_SIDE} cap`);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "entry.png");
copyFileSync(sourcePath, outPath);

// Self-check: the written file must match the bundled bytes exactly.
const writtenStat = statSync(outPath);
if (writtenStat.size !== sourceBytes.length) {
  fail(`written file is ${writtenStat.size} bytes, expected ${sourceBytes.length}`);
}

// Round-trip re-verification: read the output back from disk and
// re-derive everything from those bytes, not from memory.
const diskBytes = readFileSync(outPath);
if (!diskBytes.equals(sourceBytes)) {
  fail("round-trip mismatch: bytes on disk differ from the bundled entry");
}
const diskFormat = detectFormat(diskBytes);
if (diskFormat.kind !== format.kind) {
  fail(`round-trip mismatch: disk format is ${diskFormat.kind}, expected ${format.kind}`);
}
if (
  diskFormat.dimensions.width !== format.dimensions.width ||
  diskFormat.dimensions.height !== format.dimensions.height
) {
  fail("round-trip mismatch: dimensions on disk differ from the bundled entry");
}
console.log(
  `verified: ${diskFormat.kind} ${diskFormat.dimensions.width}x${diskFormat.dimensions.height} ` +
  `${diskBytes.length} bytes sha256 ${sha256Hex(diskBytes)}`,
);

console.log(
  `ok: wrote ${outPath} (${format.kind} ${format.dimensions.width}x${format.dimensions.height}, ` +
  `${sourceBytes.length} bytes, sha256 ${sha256Hex(sourceBytes)})`,
);
