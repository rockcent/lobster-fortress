import fs from 'node:fs';
import { getDataDirectory, getDataFilePath } from './dataDirectory';
import type { OpenClawAgentRunRecord, OpenClawCommandResult } from './openclawManager';

type OpenClawStoreData = {
  activity: OpenClawCommandResult[];
  agentRuns: OpenClawAgentRunRecord[];
};

declare global {
  var __openClawStore: OpenClawStoreData | undefined;
  var __openClawStoreMode: 'file' | 'memory' | undefined;
}

const DATA_DIRECTORY = getDataDirectory();
const STORE_FILE = getDataFilePath('openclaw-store.json');
const EMPTY_STORE: OpenClawStoreData = {
  activity: [],
  agentRuns: [],
};

const cloneStore = (input: OpenClawStoreData): OpenClawStoreData => ({
  activity: [...input.activity],
  agentRuns: [...input.agentRuns],
});

const ensureStore = (): OpenClawStoreData => {
  if (globalThis.__openClawStore) {
    return globalThis.__openClawStore;
  }

  try {
    fs.mkdirSync(DATA_DIRECTORY, { recursive: true });
    if (!fs.existsSync(STORE_FILE)) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(EMPTY_STORE, null, 2), 'utf8');
      globalThis.__openClawStore = cloneStore(EMPTY_STORE);
      globalThis.__openClawStoreMode = 'file';
      return globalThis.__openClawStore;
    }

    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = raw ? JSON.parse(raw) as Partial<OpenClawStoreData> : {};
    globalThis.__openClawStore = {
      activity: Array.isArray(parsed.activity) ? parsed.activity : [],
      agentRuns: Array.isArray(parsed.agentRuns) ? parsed.agentRuns : [],
    };
    globalThis.__openClawStoreMode = 'file';
    return globalThis.__openClawStore;
  } catch {
    globalThis.__openClawStore = cloneStore(EMPTY_STORE);
    globalThis.__openClawStoreMode = 'memory';
    return globalThis.__openClawStore;
  }
};

const persistStore = () => {
  if (globalThis.__openClawStoreMode !== 'file' || !globalThis.__openClawStore) {
    return;
  }

  try {
    fs.mkdirSync(DATA_DIRECTORY, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(globalThis.__openClawStore, null, 2), 'utf8');
  } catch {
    globalThis.__openClawStoreMode = 'memory';
  }
};

export const getOpenClawActivity = () => [...ensureStore().activity];

export const updateOpenClawActivity = (updater: (current: OpenClawCommandResult[]) => OpenClawCommandResult[]) => {
  const store = ensureStore();
  store.activity = updater([...store.activity]);
  persistStore();
  return [...store.activity];
};

export const getOpenClawAgentRuns = () => [...ensureStore().agentRuns];

export const updateOpenClawAgentRuns = (updater: (current: OpenClawAgentRunRecord[]) => OpenClawAgentRunRecord[]) => {
  const store = ensureStore();
  store.agentRuns = updater([...store.agentRuns]);
  persistStore();
  return [...store.agentRuns];
};

export const getOpenClawStorePath = () => STORE_FILE;
