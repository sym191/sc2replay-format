import type MarkdownIt from 'markdown-it';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs';
import { iconRegistry } from '../icons/icon-registry';
import type { IconTokenMeta } from '../types/icon';
import { escapeHtml } from './escape-html';

const iconPattern = /^\/icon:([a-zA-Z0-9_-]+)/;
const iconTextPattern = /\/icon:([a-zA-Z0-9_-]+)/g;

function iconInlineRule(state: StateInline, silent: boolean): boolean {
  if (state.src.charCodeAt(state.pos) !== 0x2f) {
    return false;
  }

  const match = state.src.slice(state.pos).match(iconPattern);

  if (!match) {
    return false;
  }

  if (!silent) {
    const token = state.push('icon_inline', '', 0);
    token.meta = { name: match[1] } satisfies IconTokenMeta;
  }

  state.pos += match[0].length;
  return true;
}

function createTextToken(state: StateInline, content: string) {
  const token = new state.Token('text', '', 0);
  token.content = content;
  return token;
}

function createIconToken(state: StateInline, name: string) {
  const token = new state.Token('icon_inline', '', 0);
  token.meta = { name } satisfies IconTokenMeta;
  return token;
}

function iconTextReplaceRule(state: StateInline): boolean {
  let changed = false;

  for (let i = 0; i < state.tokens.length; i += 1) {
    const token = state.tokens[i];

    if (token.type !== 'text' || !token.content.includes('/icon:')) {
      continue;
    }

    const replacement = [];
    let lastIndex = 0;
    iconTextPattern.lastIndex = 0;

    for (const match of token.content.matchAll(iconTextPattern)) {
      if (match.index > lastIndex) {
        replacement.push(createTextToken(state, token.content.slice(lastIndex, match.index)));
      }

      replacement.push(createIconToken(state, match[1]));
      lastIndex = match.index + match[0].length;
    }

    if (replacement.length === 0) {
      continue;
    }

    if (lastIndex < token.content.length) {
      replacement.push(createTextToken(state, token.content.slice(lastIndex)));
    }

    state.tokens.splice(i, 1, ...replacement);
    i += replacement.length - 1;
    changed = true;
  }

  return changed;
}

export function iconPlugin(md: MarkdownIt): void {
  md.inline.ruler.before('text', 'icon_inline', iconInlineRule);
  md.inline.ruler2.push('icon_inline_text_replace', iconTextReplaceRule);

  md.renderer.rules.icon_inline = (tokens, idx) => {
    const meta = tokens[idx].meta as IconTokenMeta | undefined;
    const rawName = typeof meta?.name === 'string' ? meta.name : '';
    const name = escapeHtml(rawName);

    if (!iconRegistry.has(rawName)) {
      return `<span class="md-icon md-icon-missing" data-icon-name="${name}">[icon:${name}]</span>`;
    }

    const url = escapeHtml(iconRegistry.getUrl(rawName) ?? '');

    return `<span class="md-icon md-icon-inline" data-icon-name="${name}"><img src="${url}" alt="${name}" draggable="false" /></span>`;
  };
}
