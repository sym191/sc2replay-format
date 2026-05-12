import MarkdownIt from 'markdown-it';
import { iconPlugin } from './icon-plugin';

const md = new MarkdownIt({
  html: false,
  linkify: true,
});

md.use(iconPlugin);

export function renderMarkdown(source: string): string {
  return md.render(source);
}
