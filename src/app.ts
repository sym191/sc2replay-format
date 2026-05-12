import { renderMarkdown } from './markdown/md';
import { parseReplayFile } from './replay/python-replay-parser';
import { validateReplayFile } from './replay/security';
import type { EditorDocument } from './replay/types';

type StatusKind = 'idle' | 'busy' | 'error' | 'success';
type FileHandler = (file: File) => void | Promise<void>;

let activeFileDropCleanup: (() => void) | null = null;

function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function setStatus(target: HTMLElement, kind: StatusKind, message: string): void {
  target.classList.remove('status-idle', 'status-busy', 'status-error', 'status-success');
  target.classList.add('status-line', `status-${kind}`);
  target.textContent = message;
}

function createHeader(): HTMLElement {
  const header = createElement('header', 'app-header');
  const titleWrap = createElement('div', 'title-wrap');
  const title = createElement('h1', 'app-title', 'SC2 Replay Documenter');
  const subtitle = createElement(
    'p',
    'app-subtitle',
    '将 StarCraft II replay 解析为 icon markdown 文档，并实时渲染为 HTML。',
  );

  titleWrap.append(title, subtitle);
  header.append(titleWrap);
  return header;
}

function downloadMarkdown(markdown: string, fileName: string): void {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function savePreviewAsPdf(fileName: string): void {
  const previousTitle = document.title;
  document.title = fileName;
  document.body.classList.add('is-pdf-print');

  const cleanup = () => {
    document.body.classList.remove('is-pdf-print');
    document.title = previousTitle;
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);
  window.print();
}

function renderPreview(preview: HTMLElement, markdown: string): void {
  preview.innerHTML = renderMarkdown(markdown);
}

function dragEventHasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

function installWindowFileDrop(dropzone: HTMLElement, handleFile: FileHandler): () => void {
  let dragDepth = 0;

  const activate = (event: DragEvent) => {
    if (!dragEventHasFiles(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer!.dropEffect = 'copy';
    dropzone.classList.add('is-dragging');
  };

  const handleDragEnter = (event: DragEvent) => {
    if (!dragEventHasFiles(event)) {
      return;
    }

    dragDepth += 1;
    activate(event);
  };

  const handleDragOver = (event: DragEvent) => {
    activate(event);
  };

  const handleDragLeave = (event: DragEvent) => {
    if (!dragEventHasFiles(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragDepth = Math.max(0, dragDepth - 1);

    if (dragDepth === 0) {
      dropzone.classList.remove('is-dragging');
    }
  };

  const handleDrop = (event: DragEvent) => {
    if (!dragEventHasFiles(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragDepth = 0;
    dropzone.classList.remove('is-dragging');

    const file = event.dataTransfer?.files[0];
    if (file) {
      void handleFile(file);
    }
  };

  window.addEventListener('dragenter', handleDragEnter, true);
  window.addEventListener('dragover', handleDragOver, true);
  window.addEventListener('dragleave', handleDragLeave, true);
  window.addEventListener('drop', handleDrop, true);

  return () => {
    window.removeEventListener('dragenter', handleDragEnter, true);
    window.removeEventListener('dragover', handleDragOver, true);
    window.removeEventListener('dragleave', handleDragLeave, true);
    window.removeEventListener('drop', handleDrop, true);
  };
}

export function startApp(root: HTMLElement): void {
  let isParsing = false;

  const clearActiveFileDrop = () => {
    activeFileDropCleanup?.();
    activeFileDropCleanup = null;
  };

  const parseAndRenderFile = async (
    file: File,
    status: HTMLElement,
    setBusy?: (busy: boolean) => void,
  ) => {
    if (isParsing) {
      setStatus(status, 'busy', '正在解析上一个 replay，请稍候...');
      return;
    }

    isParsing = true;
    setBusy?.(true);
    setStatus(status, 'busy', '检查文件...');

    try {
      const check = await validateReplayFile(file);
      if (!check.ok) {
        setStatus(status, 'error', check.message);
        return;
      }

      setStatus(status, 'success', check.message);
      const document = await parseReplayFile(file, (message) => setStatus(status, 'busy', message));
      renderResult(document, file.name);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(status, 'error', `解析失败：${message}`);
    } finally {
      isParsing = false;
      setBusy?.(false);
    }
  };

  const renderHome = (initialMessage = '文件只在当前浏览器中读取，不会上传。') => {
    clearActiveFileDrop();
    root.textContent = '';

    const shell = createElement('div', 'app-shell');
    const main = createElement('main', 'home-main');
    const dropzone = createElement('section', 'dropzone');
    const fileInput = createElement('input', 'file-input') as HTMLInputElement;
    const dropTitle = createElement('h2', 'drop-title', '拖入 SC2 replay 文件');
    const dropHint = createElement('p', 'drop-hint', '支持 .SC2Replay，解析后进入可编辑 Markdown 与实时 HTML 预览。');
    const chooseButton = createElement('button', 'primary-button', '选择文件');
    const status = createElement('p', 'status-line status-idle', initialMessage);

    fileInput.type = 'file';
    fileInput.accept = '.SC2Replay,.sc2replay';
    dropzone.tabIndex = 0;
    dropzone.setAttribute('role', 'button');
    dropzone.setAttribute('aria-label', '选择或拖入 SC2 replay 文件');
    dropzone.append(dropTitle, dropHint, chooseButton, fileInput);

    const handleFile = async (file: File) => {
      await parseAndRenderFile(file, status, (busy) => {
        chooseButton.toggleAttribute('disabled', busy);
        dropzone.classList.toggle('is-busy', busy);
        if (!busy) {
          fileInput.value = '';
        }
      });
    };

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (file) {
        void handleFile(file);
      }
    });

    chooseButton.addEventListener('click', (event) => {
      event.stopPropagation();
      fileInput.click();
    });

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fileInput.click();
      }
    });

    activeFileDropCleanup = installWindowFileDrop(dropzone, handleFile);

    main.append(dropzone, status);
    shell.append(createHeader(), main);
    root.append(shell);
  };

  const renderResult = (document: EditorDocument, sourceFileName: string) => {
    clearActiveFileDrop();
    root.textContent = '';

    let markdown = document.markdown;
    const shell = createElement('div', 'app-shell result-shell');
    const dropOverlay = createElement('div', 'result-drop-overlay', '释放 replay 文件即可重新解析');
    const header = createElement('header', 'result-header');
    const backButton = createElement('button', 'secondary-button', '返回主界面');
    const downloadButton = createElement('button', 'secondary-button', '下载 Markdown');
    const savePdfButton = createElement('button', 'secondary-button', '保存 PDF');
    const actions = createElement('div', 'result-actions');
    const titleWrap = createElement('div', 'result-title-wrap');
    const title = createElement('h1', 'result-title', document.title || 'SC2 Replay 解析结果');
    const meta = createElement('p', 'result-meta', sourceFileName);
    const status = createElement('p', 'status-line result-status status-idle', '可拖入新的 .SC2Replay 自动重新解析。');

    titleWrap.append(title, meta, status);
    actions.append(downloadButton, savePdfButton);
    header.append(backButton, titleWrap, actions);

    const layout = createElement('main', 'editor-layout');
    const editorPane = createElement('section', 'editor-pane');
    const previewPane = createElement('section', 'preview-pane');
    const editorTitle = createElement('h2', 'pane-title', 'Markdown');
    const previewTitle = createElement('h2', 'pane-title', '实时 HTML');
    const textarea = createElement('textarea', 'editor-textarea') as HTMLTextAreaElement;
    const preview = createElement('article', 'preview-content');

    textarea.value = markdown;
    textarea.spellcheck = false;
    textarea.setAttribute('aria-label', 'Markdown 文档编辑区');
    preview.setAttribute('aria-live', 'polite');

    const update = () => {
      markdown = textarea.value;
      renderPreview(preview, markdown);
    };

    const handleFile = async (file: File) => {
      await parseAndRenderFile(file, status, (busy) => {
        backButton.toggleAttribute('disabled', busy);
        downloadButton.toggleAttribute('disabled', busy);
        savePdfButton.toggleAttribute('disabled', busy);
        shell.classList.toggle('is-busy', busy);
      });
    };

    textarea.addEventListener('input', update);
    backButton.addEventListener('click', () => renderHome('已返回主界面，可继续解析新的 replay。'));
    downloadButton.addEventListener('click', () => {
      const name = sourceFileName.replace(/\.sc2replay$/i, '') || 'sc2-replay';
      downloadMarkdown(markdown, `${name}.md`);
    });
    savePdfButton.addEventListener('click', () => {
      const name = sourceFileName.replace(/\.sc2replay$/i, '') || 'sc2-replay';
      savePreviewAsPdf(`${name}.pdf`);
    });

    editorPane.append(editorTitle, textarea);
    previewPane.append(previewTitle, preview);
    layout.append(editorPane, previewPane);
    shell.append(header, layout, dropOverlay);
    root.append(shell);
    activeFileDropCleanup = installWindowFileDrop(shell, handleFile);
    update();
  };

  renderHome();
}
