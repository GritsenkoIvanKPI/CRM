import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] || "";
const width = Number(process.argv[4] || 1440);
const height = Number(process.argv[5] || 900);

const CHROME_PATH =
  "/Users/ivan/.cache/puppeteer/chrome/mac_arm-150.0.7871.24/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

const outDir = path.join(__dirname, "temporary screenshots");
fs.mkdirSync(outDir, { recursive: true });

const existingNums = fs
  .readdirSync(outDir)
  .map((f) => f.match(/^screenshot-(\d+)/))
  .filter(Boolean)
  .map((m) => Number(m[1]));
const n = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
const outFile = path.join(
  outDir,
  `screenshot-${n}${label ? "-" + label : ""}.png`,
);

const browser = await puppeteer.launch({
  executablePath: CHROME_PATH,
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width, height });

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(String(err)));

// Drive the real login form instead of injecting a cookie via CDP —
// CDP's Network.setCookie proved unreliable across routes in this app
// (auth succeeded on some paths and not others despite the same session
// token working fine over plain curl). Logging in through the UI exercises
// the exact flow a real user takes and lets the browser set its own cookie
// from the Set-Cookie response header, which has no such race.
if (process.env.LOGIN_PASSWORD) {
  const origin = new URL(url).origin;
  await page.goto(`${origin}/login`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.type("#password", process.env.LOGIN_PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }),
    page.click("button[type=submit]"),
  ]);
}

await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: outFile, fullPage: true });
await browser.close();

console.log(outFile);
if (consoleErrors.length > 0) {
  console.log("--- console errors ---");
  for (const e of consoleErrors) console.log(e);
}

// Note: on very tall pages (~2000px+), Chrome DevTools Protocol's
// screenshot serialization can ghost stray text from elsewhere in the DOM
// into the capture (confirmed via DOM inspection to be a capture-only
// artifact — the real element is correctly positioned, single-instance,
// static). Harmless to review, doesn't reflect real rendering; if a tall
// page needs pixel-exact review, screenshot it in viewport-sized chunks
// instead of relying on fullPage capture.
