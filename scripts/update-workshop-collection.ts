import { createInterface } from 'readline';
import { chromium, BrowserContext, Page } from 'playwright';
import { readFileSync } from 'fs';
import assert from 'assert';

const readline = createInterface({ input: process.stdin, output: process.stdout });

function getParam(name: string, defaultValue?: string): string {
  const result = process.env[name] || defaultValue;
  if (!result) throw new Error(`Parameter ${name} is not provided`);
  return result;
}

function assertPositiveSafeIntegerValue(v: unknown): number {
  v = Number(v);
  assert(typeof v === 'number');
  assert(Number.isSafeInteger(v) && v > 0);
  return v;
}

const COLLECTION_ID = getParam("COLLECTION_ID");
const IDS_FILE = getParam("IDS_FILE");
const REQUEST_DELAY_MS = assertPositiveSafeIntegerValue(getParam("REQUEST_DELAY_MS", "700"));

const COLLECTION_URL = `https://steamcommunity.com/sharedfiles/managecollection/?id=${COLLECTION_ID}`;

interface ChangeSet {
  toAdd: string[];
  toRemove: string[];
}

interface AddResult {
  status: number;
  data: unknown;
}

interface OperationResult {
  success: number;
  failed: number;
}

const sleep = async (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const extractIds = (text: string) => new Set<string>(text.match(/\b\d{6,20}\b/g) || []);
const readDesiredIds = (): Set<string> => extractIds(readFileSync(IDS_FILE, 'utf8'));
const waitForEnter = async () => new Promise<void>(resolve => readline.question('', () => resolve()));

async function createBrowser(): Promise<BrowserContext> {
  return chromium.launchPersistentContext('./steam-profile', {
    headless: false,
    viewport: { width: 1400, height: 1000 }
  });
}

async function waitForLogin(): Promise<void> {
  console.log('\nSteam collection page opened.');
  console.log('Log in manually if Steam asks for authentication.');
  console.log('Press Enter when the collection page is ready.');
  await waitForEnter();
}

async function openCollection(page: Page): Promise<void> {
  await page.goto(COLLECTION_URL, { waitUntil: 'domcontentloaded' });
  await waitForLogin();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
}

async function getSessionId(page: Page): Promise<string> {
  const sessionId = await page.evaluate(() => window.g_sessionID);
  if (!sessionId) throw new Error('Steam session ID was not found.');
  return sessionId;
}

async function getCollectionItems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const result = new Set<string>();
    const container = document.querySelector('#sortable_items');
    if (!container) return [];
    const links = container.querySelectorAll<HTMLAnchorElement>('a[href*="filedetails"]');
    for (const link of links) {
      const id = new URL(link.href).searchParams.get('id');
      if (id && /^\d+$/.test(id)) result.add(id);
    }
    return [...result];
  });
}

async function getActiveSection(page: Page): Promise<string> {
  return page.evaluate(() => {
    const link = document.querySelector('.manageCollectionHeader .breadcrumbs a');
    return link ? link.textContent?.trim() || '' : 'My Subscribed Items';
  });
}

function calculateChanges(desired: Set<string>, current: Set<string>): ChangeSet {
  const toAdd = [...desired].filter(id => !current.has(id));
  const toRemove = [...current].filter(id => !desired.has(id));
  return { toAdd, toRemove };
}

function printChanges(toAdd: string[], toRemove: string[], desired: Set<string>): void {
  console.log('\nSynchronization plan:');
  console.log(`  Add:  ${toAdd.length}`);
  console.log(`  Remove: ${toRemove.length}`);
  console.log(`  Keep:   ${desired.size - toAdd.length}`);
  console.log('\nItems to add:');
  toAdd.forEach(id => console.log(`  + ${id}`));
  console.log('\nItems to remove:');
  toRemove.forEach(id => console.log(`  - ${id}`));
}

async function confirmChanges(): Promise<void> {
  console.log('\nPress Enter to apply these changes, or Ctrl+C to abort.');
  await waitForEnter();
}

async function addItem(
  page: Page,
  sessionId: string,
  activeSection: string,
  itemId: string
): Promise<AddResult> {
  return page.evaluate(
    async ({ collectionId, sessionId, itemId, activeSection }) => {
      const body = new URLSearchParams();
      body.set('id', collectionId);
      body.set('sessionid', sessionId);
      body.set('childid', itemId);
      body.set('activeSection', activeSection);
      const response = await fetch(
        'https://steamcommunity.com/sharedfiles/addchild',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body
        }
      );
      const text = await response.text();
      try {
        return {
          status: response.status,
          data: JSON.parse(text)
        };
      } catch {
        return { status: response.status, data: text };
      }
    },
    {
      collectionId: COLLECTION_ID,
      sessionId,
      itemId,
      activeSection
    }
  );
}

function isSuccessfulAdd(result: AddResult): boolean {
  if (!result.data || typeof result.data !== 'object') return false;
  const data = result.data as { success?: number | boolean };
  return data.success === 1 || data.success === true;
}

async function addItems(
  page: Page,
  sessionId: string,
  activeSection: string,
  ids: string[]
): Promise<OperationResult> {
  let success = 0;
  let failed = 0;
  for (const itemId of ids) {
    try {
      const result = await addItem(page, sessionId, activeSection, itemId);
      if (isSuccessfulAdd(result)) {
        success++;
        console.log(`[ADD ${success}/${ids.length}] OK ${itemId}`);
      } else {
        failed++;
        console.log(`[ADD FAILED] ${itemId}`, result.data);
      }
    } catch (error) {
      failed++;
      console.log(`[ADD ERROR] ${itemId}: ${getErrorMessage(error)}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }
  return { success, failed };
}

async function removeItem(page: Page, itemId: string): Promise<void> {
  await page.evaluate(async id => {
    if (typeof window.RemoveChildFromCollection !== 'function') {
      throw new Error('RemoveChildFromCollection is unavailable.');
    }
    window.RemoveChildFromCollection(id);
    await new Promise(resolve => setTimeout(resolve, 500));
  }, itemId);
}

async function removeItems(
  page: Page,
  ids: string[]
): Promise<OperationResult> {
  let success = 0;
  let failed = 0;
  for (const itemId of ids) {
    try {
      await removeItem(page, itemId);
      success++;
      console.log(`[REMOVE ${success}/${ids.length}] OK ${itemId}`);
    } catch (error) {
      failed++;
      console.log(`[REMOVE ERROR] ${itemId}: ${getErrorMessage(error)}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }
  return { success, failed };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function printSummary(addResult: OperationResult, removeResult: OperationResult): void {
  console.log('\n==============================');
  console.log('Synchronization finished');
  console.log('==============================');
  console.log(`Added:      ${addResult.success}`);
  console.log(`Failed adds:  ${addResult.failed}`);
  console.log(`Removed:    ${removeResult.success}`);
  console.log(`Failed removes: ${removeResult.failed}`);
  console.log('==============================');
}

async function verify(page: Page, desiredIds: Set<string>): Promise<void> {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const finalIds = new Set(await getCollectionItems(page));
  const missing = [...desiredIds].filter(id => !finalIds.has(id));
  const extra = [...finalIds].filter(id => !desiredIds.has(id));
  console.log('\nVerification:');
  console.log(`  Expected: ${desiredIds.size}`);
  console.log(`  Actual:   ${finalIds.size}`);
  console.log(`  Missing:  ${missing.length}`);
  console.log(`  Extra:  ${extra.length}`);
  printVerificationDetails(missing, extra);
}

function printVerificationDetails(missing: string[], extra: string[]): void {
  if (missing.length) {
    console.log('\nStill missing:');
    missing.forEach(id => console.log(`  ${id}`));
  }
  if (extra.length) {
    console.log('\nStill present but not requested:');
    extra.forEach(id => console.log(`  ${id}`));
  }
}

function printCollectionUrl(): void {
  console.log(`\nCollection: https://steamcommunity.com/sharedfiles/filedetails/?id=${COLLECTION_ID}`);
}

async function synchronize(page: Page): Promise<void> {
  const desiredIds = readDesiredIds();
  if (!desiredIds.size) {
    throw new Error('ids.txt does not contain any Workshop IDs.');
  }
  const sessionId = await getSessionId(page);
  const currentIds = new Set(await getCollectionItems(page));
  const activeSection = await getActiveSection(page);
  const changes = calculateChanges(desiredIds, currentIds);
  console.log(`Current collection items: ${currentIds.size}`);
  if (!changes.toAdd.length && !changes.toRemove.length) return console.log('\nCollection is already synchronized.');
  printChanges(changes.toAdd, changes.toRemove, desiredIds);
  await confirmChanges();
  const addResult = await addItems(page, sessionId, activeSection, changes.toAdd);
  const removeResult = await removeItems(page, changes.toRemove);
  printSummary(addResult, removeResult);
  await verify(page, desiredIds);
  printCollectionUrl();
}

async function main(): Promise<void> {
  const context = await createBrowser();
  const page = await context.newPage();
  try {
    await openCollection(page);
    await synchronize(page);
  } finally {
    await context.close();
  }
}

main()
  .finally(() => readline.close())
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\nFatal error:');
    console.error(error);
    process.exit(1);
  });
