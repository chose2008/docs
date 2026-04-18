# MEMORY.md - 长期记忆

## 2026-04-18

### 项目：chose2008.xyz 知识库网站

帮用户搭建了完整的知识库网站：
- 域名：chose2008.xyz（Cloudflare 管理）
- 技术：MkDocs + Material 主题 + Cloudflare Pages
- 源码：GitHub 仓库 chose2008/docs
- CMS：Decap CMS 配置中（待修复 404 问题）

关键配置：
- GitHub OAuth App：Docs CMS
- Cloudflare 环境变量：OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, PYTHON_VERSION
- 构建命令：mkdocs build

待办：修复 admin 路径 404，完成 CMS 集成。
