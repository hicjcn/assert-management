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

> 首次部署提示：首次成功登录时，系统会将该用户名自动创建为管理员账号。

## 通行密钥登录

登录页支持使用 Passkey 登录，可通过 iPhone 的 Face ID 和 iCloud 钥匙串完成验证。首次使用时，先通过用户名和密码登录，然后在“设置 → 通行密钥”中创建。

生产环境需要满足以下条件：

- 必须使用 HTTPS 域名，不能通过普通 HTTP 的局域网 IP 使用。
- `APP_URL` 必须填写用户实际访问的完整站点地址，例如 `https://asset.example.com`。
- 默认使用 `APP_URL` 的主机名作为 RP ID；需要在子域名间共享通行密钥时，可通过 `PASSKEY_RP_ID` 指定父域名。
- 可通过 `PASSKEY_RP_NAME` 自定义系统通行密钥提示中显示的站点名称。

部署本次数据库变更前，需要运行 `npm run prisma:deploy` 创建通行密钥凭证表。
