import type { EditorDocument } from './types';

interface PyodideRuntime {
  FS: {
    mkdirTree(path: string): void;
    writeFile(path: string, data: Uint8Array): void;
    unlink(path: string): void;
  };
  runPythonAsync<T = unknown>(code: string): Promise<T>;
}

declare global {
  interface Window {
    loadPyodide?: (options: { indexURL: string }) => Promise<PyodideRuntime>;
  }
}

const PYODIDE_VERSION = '0.29.2';
const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYTHON_BUNDLE_URL = `${import.meta.env.BASE_URL}python/sc2replay-python-files.json`;
const PYTHON_EXTRACT_DIR = '/tmp/sc2replay-python';

interface PythonBundleFile {
  path: string;
  data: string;
}

interface PythonBundle {
  schema: string;
  files: PythonBundleFile[];
}

let scriptPromise: Promise<void> | null = null;
let runtimePromise: Promise<PyodideRuntime> | null = null;

function buildBootstrapScript(): string {
  return `
import sys

extract_dir = ${JSON.stringify(PYTHON_EXTRACT_DIR)}

if extract_dir not in sys.path:
    sys.path.insert(0, extract_dir)

import sc2_replay_exporter
`;
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function normalizeBundlePath(path: string): string {
  const normalized = path.replace(/\\/g, '/');

  if (normalized.startsWith('/') || normalized.split('/').includes('..')) {
    throw new Error(`解析模块包含非法路径：${path}`);
  }

  return normalized;
}

function ensureDirectory(pyodide: PyodideRuntime, path: string): void {
  if (path) {
    pyodide.FS.mkdirTree(path);
  }
}

function writePythonBundle(pyodide: PyodideRuntime, bundle: PythonBundle): void {
  if (!Array.isArray(bundle.files)) {
    throw new Error('解析模块清单格式无效。');
  }

  ensureDirectory(pyodide, PYTHON_EXTRACT_DIR);

  for (const file of bundle.files) {
    const normalizedPath = normalizeBundlePath(file.path);
    const targetPath = `${PYTHON_EXTRACT_DIR}/${normalizedPath}`;
    const lastSlash = targetPath.lastIndexOf('/');

    ensureDirectory(pyodide, targetPath.slice(0, lastSlash));
    pyodide.FS.writeFile(targetPath, decodeBase64(file.data));
  }
}

function loadPyodideScript(): Promise<void> {
  if (window.loadPyodide) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${PYODIDE_BASE_URL}pyodide.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('无法加载 Pyodide 运行时。'));
    };
    document.head.append(script);
  });

  return scriptPromise;
}

async function createRuntime(onProgress: (message: string) => void): Promise<PyodideRuntime> {
  onProgress('加载 Python 运行时...');
  await loadPyodideScript();

  if (!window.loadPyodide) {
    throw new Error('Pyodide 初始化失败。');
  }

  const pyodide = await window.loadPyodide({ indexURL: PYODIDE_BASE_URL });

  onProgress('加载 SC2 replay 解析模块...');
  const response = await fetch(PYTHON_BUNDLE_URL);
  if (!response.ok) {
    throw new Error(`无法加载解析模块：HTTP ${response.status}`);
  }

  writePythonBundle(pyodide, (await response.json()) as PythonBundle);
  await pyodide.runPythonAsync(buildBootstrapScript());

  return pyodide;
}

async function getRuntime(onProgress: (message: string) => void): Promise<PyodideRuntime> {
  if (!runtimePromise) {
    runtimePromise = createRuntime(onProgress).catch((error: unknown) => {
      runtimePromise = null;
      throw error;
    });
  } else {
    onProgress('复用已加载的 Python 运行时...');
  }

  return runtimePromise;
}

function inputPathFor(fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80) || 'input.SC2Replay';
  const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : String(Date.now());
  return `/tmp/${id}-${safeName}`;
}

function buildPythonScript(inputPath: string): string {
  return `
import json
from sc2_replay_exporter.editor_formatter import build_editor_document
from sc2_replay_exporter.parser import parse_replay

state = parse_replay(${JSON.stringify(inputPath)})
document = build_editor_document(state.to_export())
json.dumps(document, ensure_ascii=False)
`;
}

function normalizeParseError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

export async function parseReplayFile(
  file: File,
  onProgress: (message: string) => void,
): Promise<EditorDocument> {
  const pyodide = await getRuntime(onProgress);
  const inputPath = inputPathFor(file.name);

  try {
    onProgress('读取 replay 文件...');
    pyodide.FS.writeFile(inputPath, new Uint8Array(await file.arrayBuffer()));

    onProgress('解析 replay 并生成 Markdown...');
    const result = await pyodide.runPythonAsync<string>(buildPythonScript(inputPath));
    const document = JSON.parse(result) as EditorDocument;

    if (!document.markdown || typeof document.markdown !== 'string') {
      throw new Error('解析结果缺少 Markdown 内容。');
    }

    return document;
  } catch (error) {
    throw normalizeParseError(error);
  } finally {
    try {
      pyodide.FS.unlink(inputPath);
    } catch {
      // Best-effort cleanup inside Pyodide FS.
    }
  }
}
