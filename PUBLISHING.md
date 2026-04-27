# GitHub 发布指南

## 推荐仓库名

```txt
image-prompt-library
```

## 推荐简介

```txt
AI 图像提示词与样板图管理工具：支持案例图库、提示词展示版、填空模板、多图资产和用户自建提示词库。
```

## 推荐 Topics

```txt
ai
prompt-engineering
image-generation
gpt-image
prompt-library
react
typescript
sqlite
```

## 方式一：使用 GitHub CLI 发布

安装并登录 GitHub CLI 后，在项目根目录运行：

```bash
gh auth login
gh repo create image-prompt-library --public --source=. --remote=origin --push
```

## 方式二：网页建仓库后手动推送

先在 GitHub 网页新建空仓库：

```txt
image-prompt-library
```

不要勾选自动创建 README、LICENSE 或 .gitignore，因为本项目已经带了。

然后在项目根目录运行：

```bash
git init
git add .
git commit -m "Initial release: ImagePrompt Library"
git branch -M main
git remote add origin https://github.com/<你的用户名>/image-prompt-library.git
git push -u origin main
```

## 图片是否提交？

默认建议：第一版先不提交 346 张案例图片，只提交代码和数据清单。  
原因：

1. 仓库更轻；
2. clone 更快；
3. 避免素材授权争议；
4. 用户可自行复制原项目图片到 `public/data/images/`。

如果你确认要打包完整体验，也可以提交图片，但请保留 `ATTRIBUTION.md`。
