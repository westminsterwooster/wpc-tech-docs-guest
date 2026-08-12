import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const puppeteerCliPath = require.resolve("puppeteer/lib/cjs/puppeteer/node/cli.js");

function runBrowserInstall() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [puppeteerCliPath, "browsers", "install", "chrome"],
      {
        env: {
          ...process.env,
          PUPPETEER_SKIP_DOWNLOAD: "false",
        },
        stdio: "inherit",
      },
    );

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Puppeteer Chrome install exited with code ${code}`));
      }
    });
  });
}

export async function installPdfBrowser({ attempts = 3 } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await runBrowserInstall();
      return;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        break;
      }

      const delayMs = attempt * 3000;
      console.warn(
        `Puppeteer Chrome install failed on attempt ${attempt}; retrying in ${delayMs / 1000}s.`,
      );
      await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
    }
  }

  throw lastError;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await installPdfBrowser();
}
