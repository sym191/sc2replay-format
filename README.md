# SC2 Replay Documenter

一个静态前端项目，用于把 `.SC2Replay` 文件解析成 `icon-md-editor` 兼容的 Markdown，并实时渲染成 HTML 预览。

## 功能

- 拖入或选择 `.SC2Replay` 文件
- 在浏览器本地完成扩展名、大小和 MPQ 文件头检查
- 通过 Pyodide 运行 `sc2reader` 与 `sc2_replay_exporter`
- 输出可编辑 Markdown，并实时渲染 icon markdown HTML
- GitHub Actions 自动构建并部署到 GitHub Pages

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 部署

推送到 `main` 分支后，`.github/workflows/pages.yml` 会执行构建并发布 `dist` 到 GitHub Pages。
