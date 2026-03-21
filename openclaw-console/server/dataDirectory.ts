import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_DATA_DIRECTORY_NAME = '.data';

const resolveConfiguredDataDirectory = () => {
  const configured = process.env.OPENCLAW_CONSOLE_DATA_DIR?.trim();
  if (!configured) {
    return path.resolve(process.cwd(), DEFAULT_DATA_DIRECTORY_NAME);
  }

  return path.isAbsolute(configured)
    ? configured
    : path.resolve(process.cwd(), configured);
};

const resolveLegacyDataDirectory = () => path.resolve(process.cwd(), DEFAULT_DATA_DIRECTORY_NAME);

export const getDataDirectory = () => resolveConfiguredDataDirectory();

export const getDataFilePath = (fileName: string) => {
  const dataDirectory = resolveConfiguredDataDirectory();
  const targetFile = path.join(dataDirectory, fileName);
  const legacyFile = path.join(resolveLegacyDataDirectory(), fileName);

  if (targetFile !== legacyFile && !fs.existsSync(targetFile) && fs.existsSync(legacyFile)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
    fs.copyFileSync(legacyFile, targetFile);
  }

  return targetFile;
};
