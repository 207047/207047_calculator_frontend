# 计算器前端

网页版计算器，负责输入、展示结果和历史。真正的计算在后端完成。

## 技术栈

- Vue 3
- Vite
- fetch

## 环境

- Node.js 20+
- npm

## 安装和运行

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

打包：

```bash
npm run build
```

## 配置

开发时不用改配置。`vite.config.js` 会把 `/api` 代理到 `http://localhost:8080`，所以要先启动后端。

如果前后端不在一起部署，可以设置：

```
VITE_API_BASE=http://后端地址
```

## 接口对接

| 做什么 | 调哪个接口 |
| --- | --- |
| 计算 | `POST /api/calculate` |
| 看历史 | `GET /api/history` |
| 删一条 | `DELETE /api/history/{id}` |
| 清空 | `DELETE /api/history` |

计算时只传表达式，例如：

```json
{"expression":"(1+2)*3"}
```

页面上显示的结果用后端返回的 `result`。

## 在线地址

http://125.208.17.18:8888/
