import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const baseUrl = process.env.PROOFLOOM_URL || "http://127.0.0.1:5173/proofloom/";
const output = "artifacts/ui";
const account = "0x95803126315A05E642D8E46CE1d77eA2199a2A6E";
mkdirSync(output, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

async function mockWallet(page, persisted = false) {
  await page.addInitScript(
    ({ wallet, remember }) => {
      if (remember) localStorage.setItem("proofloom.walletConnected", "true");
      window.ethereum = {
        on() {},
        removeListener() {},
        request: async ({ method }) => {
          if (method === "eth_accounts" || method === "eth_requestAccounts") return [wallet];
          if (method === "wallet_switchEthereumChain" || method === "wallet_addEthereumChain") return null;
          if (method === "wallet_getSnaps") return {};
          if (method === "wallet_requestSnaps") return {};
          if (method === "eth_chainId") return "0x107d";
          throw new Error(`Unsupported QA wallet request: ${method}`);
        },
      };
    },
    { wallet: account, remember: persisted },
  );
}

async function inspect(name, viewport, connected = false, persistenceCheck = false) {
  const page = await browser.newPage({ viewport });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await mockWallet(page, connected);

  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });
  if (connected) {
    await page.locator(".path-scrap").first().waitFor({ timeout: 120_000 });
  }

  const metrics = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 2,
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    pageHeight: document.documentElement.scrollHeight,
    connected: document.querySelector(".workspace") !== null,
    visibleRectangles: [...document.querySelectorAll(".archipelago article, .archipelago aside, .archipelago > div")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 120 && rect.height > 80;
      }).length,
  }));

  const interactions = [];
  if (connected) {
    const expectedByView = {
      paths: "Learning paths",
      credentials: "Credential passport",
      opportunities: "Opportunity exchange",
      guilds: "Guild commons",
      governance: "Standards assembly",
    };
    for (const [view, expected] of Object.entries(expectedByView)) {
      await page.locator(`[data-view="${view}"]`).click();
      interactions.push({
        view,
        visible: await page.getByRole("heading", { name: expected, exact: true }).isVisible(),
      });
    }
    await page.locator('[data-form="create_standard"]').click();
    interactions.push({
      view: "transaction-form",
      visible: await page.getByText("Propose a standard", { exact: true }).isVisible(),
      submitEnabled: await page.locator(".pattern-submit").isEnabled(),
    });
    await page.locator(".pattern-close").click();
    if (persistenceCheck) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.locator(".path-scrap").first().waitFor({ timeout: 180_000 });
      interactions.push({
        view: "wallet-persistence",
        visible: await page.locator(".workspace").isVisible(),
      });
    }
  }

  const screenshot = `${output}/${name}.png`;
  await page.screenshot({ path: screenshot, fullPage: !connected });
  results.push({ name, metrics, interactions, consoleErrors, pageErrors, screenshot });
  await page.close();
}

await inspect("landing-desktop", { width: 1440, height: 900 });
await inspect("app-desktop", { width: 1440, height: 900 }, true, true);
await inspect("landing-mobile", { width: 390, height: 844 });
await inspect("app-mobile", { width: 390, height: 844 }, true);

await browser.close();
writeFileSync(`${output}/qa-results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
