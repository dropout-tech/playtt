# GitHub Pages 部署指南

## 📋 部署方式

本项目支持两种部署方式：

### 方式一：使用 GitHub Actions（推荐）✨

**已配置完成！** 每次推送到 `master` 或 `main` 分支时，会自动构建并部署到 GitHub Pages。

#### 使用步骤：

1. **启用 GitHub Pages**
   - 进入仓库设置：`Settings` → `Pages`
   - Source 选择：`GitHub Actions`
   - 保存设置

2. **推送代码**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin master
   ```

3. **查看部署状态**
   - 进入 `Actions` 标签页
   - 查看部署进度
   - 部署完成后，网站将在 `https://dropout-tech.github.io/playtt` 可用

---

### 方式二：手动部署

#### 使用步骤：

1. **构建项目**
   ```bash
   cd letsplay_front
   npm run build
   ```

2. **部署到 GitHub Pages**
   ```bash
   npm run deploy
   ```

   这会：
   - 自动构建项目
   - 将 `build` 文件夹推送到 `gh-pages` 分支
   - GitHub Pages 会自动从 `gh-pages` 分支部署

---

## 🔧 配置说明

### package.json 配置

```json
{
  "homepage": "https://dropout-tech.github.io/playtt",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

### GitHub Actions Workflow

工作流文件位置：`.github/workflows/deploy.yml`

**触发条件：**
- 推送到 `master` 或 `main` 分支
- 手动触发（workflow_dispatch）

**工作流程：**
1. 检出代码
2. 设置 Node.js 环境
3. 安装依赖
4. 构建项目
5. 部署到 GitHub Pages

---

## 🌐 访问地址

部署成功后，网站将在以下地址可用：

**https://dropout-tech.github.io/playtt**

---

## 📝 注意事项

1. **首次部署**
   - 需要在 GitHub 仓库设置中启用 GitHub Pages
   - 选择 Source 为 `GitHub Actions`（如果使用方式一）
   - 或选择 `gh-pages` 分支（如果使用方式二）

2. **路由配置**
   - 如果使用 React Router，需要配置 `basename`
   - 当前配置：`homepage: "https://dropout-tech.github.io/playtt"`

3. **自定义域名**
   - 如需使用自定义域名，在仓库设置中添加 `CNAME` 文件
   - 并配置 DNS 记录

4. **构建优化**
   - 确保 `package.json` 中的 `homepage` 字段正确
   - 构建后的静态资源路径会自动调整

---

## 🐛 故障排除

### 问题：部署后页面空白

**解决方案：**
1. 检查 `package.json` 中的 `homepage` 字段是否正确
2. 检查构建是否成功：`npm run build`
3. 检查 `build` 文件夹是否包含所有文件

### 问题：路由不工作

**解决方案：**
1. 确保 React Router 配置了正确的 `basename`
2. 检查 GitHub Pages 是否支持 SPA（单页应用）
3. 考虑使用 HashRouter 替代 BrowserRouter

### 问题：GitHub Actions 部署失败

**解决方案：**
1. 检查 Actions 日志查看错误信息
2. 确保 Node.js 版本兼容
3. 检查依赖安装是否成功

---

## 📚 相关资源

- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Create React App 部署文档](https://create-react-app.dev/docs/deployment/#github-pages)

---

**最后更新：** 2025年1月

