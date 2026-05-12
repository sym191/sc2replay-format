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

如果第一次部署时报 `Get Pages site failed` 或 `Not Found`，说明仓库还没有启用 GitHub Pages。处理方式二选一：

1. 在 GitHub 仓库 `Settings -> Pages` 中把 Source 设为 `GitHub Actions`，之后再次运行 workflow。
2. 创建一个可管理 Pages 的 token，保存为仓库 secret：`PAGES_ENABLE_TOKEN`。workflow 检测到这个 secret 后会自动启用 Pages。
