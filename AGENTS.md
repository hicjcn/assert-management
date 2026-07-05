# 仓库指南

<!-- BEGIN:nextjs-agent-rules -->
## Next.js 版本提醒

当前项目使用较新的 Next.js 版本，API、约定和文件结构可能与旧经验不同。修改 Next.js 相关代码前，优先参考 `node_modules/next/dist/docs/` 中的本地文档，并留意废弃提示。
<!-- END:nextjs-agent-rules -->

## 项目结构与模块组织

当前仓库已初始化为手机优先的 Next.js 资产管家项目，主要文件包括：

- `需求.md`：产品需求文档。
- `技术方案.md`：自部署 Web App 技术方案。
- `src/app/`：页面、布局、路由处理器和 API。
- `src/components/`：移动端布局、UI、图表和表单组件。
- `src/server/`：认证、数据库访问和业务服务。
- `src/lib/`：金额、日期、格式化、校验等工具函数。
- `src/types/`：领域类型和枚举常量。
- `prisma/`：Prisma schema 与数据库迁移。
- `tests/` 与 `*.test.ts(x)`：测试配置和自动化测试。

## 构建、测试与开发命令

- `npm run dev`：启动本地开发服务。
- `npm run build`：生成 Prisma Client 并构建生产版本。
- `npm run start`：运行生产构建。
- `npm run lint`：执行 ESLint 检查。
- `npm test`：运行 Vitest 测试。
- `npm run prisma:generate`：生成 Prisma Client。
- `npm run prisma:migrate`：创建并应用本地迁移。
- `npm run prisma:deploy`：在生产环境应用迁移。

## 编码风格与命名约定

应用代码统一使用 TypeScript，缩进使用 2 个空格。React 组件使用 `PascalCase`，函数和变量使用 `camelCase`，路由目录使用小写路径。业务规则放在清晰的小型 service 或 lib 函数中。金额统一按“分”存储为整数，避免浮点数计算金额。

## 测试指南

优先测试金额计算、账户变更规则、目标达成预测和图表聚合逻辑。测试文件使用 `*.test.ts` 或 `*.test.tsx` 命名。涉及数据库的测试必须与生产 MySQL 隔离，可使用独立测试库或 mock。

## 提交与 Pull Request 规范

当前目录还不是 Git 仓库，因此没有现成提交约定。后续建议使用简洁的祈使句提交信息，例如 `Add account schema`、`Implement dashboard totals`。PR 需要包含变更摘要、UI 截图、Prisma 迁移说明，以及手工验证步骤。

## 安全与配置建议

不要提交 `.env`、数据库密码或服务器密钥。MySQL 应独立部署，不放入应用容器。生产环境必须启用 HTTPS，并限制数据库只允许应用服务器访问。
