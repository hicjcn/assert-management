# 资产管家

手机优先的个人资产管理 Web App，面向 iPhone Safari 使用，可自部署到云服务器，数据存储在外部 MySQL 或云数据库中。

## 技术栈

- Next.js + TypeScript
- Tailwind CSS
- Prisma + MySQL
- ECharts
- React Hook Form + Zod
- Dockerfile 单应用镜像

## 本地开发

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

开发服务默认运行在 `http://localhost:3000`。

## 常用命令

```bash
npm run dev              # 启动开发服务
npm run build            # 生成 Prisma Client 并构建生产版本
npm run lint             # 运行 ESLint
npm test                 # 运行测试
npm run prisma:migrate   # 本地创建并应用迁移
npm run prisma:deploy    # 生产环境应用迁移
```

## 部署说明

应用镜像只包含 Next.js 服务，不包含 MySQL。生产环境通过 `DATABASE_URL` 连接外部数据库。

```bash
docker build -t asset-management:latest .
docker run -d \
  --name asset-management \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.production \
  asset-management:latest
```

生产环境必须启用 HTTPS，并限制 MySQL 仅允许应用服务器访问。
