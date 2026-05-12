export interface ReplayFileCheck {
  ok: boolean;
  message: string;
}

const MAX_REPLAY_BYTES = 128 * 1024 * 1024;
const MPQ_A = 0x1a;
const MPQ_USER_DATA = 0x1b;

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const mib = bytes / 1024 / 1024;
  if (mib >= 1) {
    return `${mib.toFixed(1)} MiB`;
  }

  return `${(bytes / 1024).toFixed(1)} KiB`;
}

export async function validateReplayFile(file: File): Promise<ReplayFileCheck> {
  if (!file.name.toLowerCase().endsWith('.sc2replay')) {
    return {
      ok: false,
      message: '文件扩展名不是 .SC2Replay。',
    };
  }

  if (file.size <= 0) {
    return {
      ok: false,
      message: '文件为空，无法解析。',
    };
  }

  if (file.size > MAX_REPLAY_BYTES) {
    return {
      ok: false,
      message: `文件过大：${formatBytes(file.size)}，当前上限是 ${formatBytes(MAX_REPLAY_BYTES)}。`,
    };
  }

  if (file.size < 4) {
    return {
      ok: false,
      message: '文件太小，不像有效的 SC2 replay。',
    };
  }

  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isMpq =
    header[0] === 0x4d &&
    header[1] === 0x50 &&
    header[2] === 0x51 &&
    (header[3] === MPQ_A || header[3] === MPQ_USER_DATA);

  if (!isMpq) {
    return {
      ok: false,
      message: '文件头不是 MPQ/SC2Replay 格式。',
    };
  }

  return {
    ok: true,
    message: `检查通过：${file.name}，${formatBytes(file.size)}。`,
  };
}
