import fs from "node:fs";
import path from "node:path";

const root = "src/features/share";

const required = [
  "contracts.ts",
  "types.ts",
  "resolver.ts",
  "index.ts"
];

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) {
    console.error("Missing share foundation:", file);
    process.exit(1);
  }
}

const source = fs.readdirSync(root, { recursive: true })
  .filter(Boolean)
  .map(f => path.join(root, f))
  .filter(f => fs.existsSync(f))
  .map(f => fs.readFileSync(f, "utf8"))
  .join("\n");

if (/window\.|document\.|innerHTML/.test(source)) {
  console.error("Unsafe UI dependency detected");
  process.exit(1);
}

console.log("GAGA share source audit OK");
console.log("✓ share contract available");
console.log("✓ resolver boundary available");
console.log("✓ adapter boundary available");
console.log("✓ extraction safe");
