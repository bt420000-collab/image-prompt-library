# Attribution / 素材与来源说明

本项目 `图像配方库 ImagePrompt Library` 是一个用于管理 AI 图像提示词与样板图的开源工具。

## 内置案例来源

内置案例数据整理自：

- 原项目：`freestylefly/awesome-gpt-image-2`
- GitHub：https://github.com/freestylefly/awesome-gpt-image-2
- 原项目定位：Prompt as Code / GPT-Image2 工业级提示词引擎与模板库
- 原项目许可证：MIT License

本项目在此基础上增加了：

- SQLite 数据库结构
- 前后端管理界面
- 展示版中文提示词字段
- 填空模板中文提示词字段
- 多图案例资产结构
- 用户自建提示词库能力

## 图片说明

为了控制仓库体积，本项目默认不附带 346 张案例图片。  
用户可自行从原项目获取图片，并复制到：

```txt
public/data/images/
```

例如：

```txt
public/data/images/case1.jpg
public/data/images/case2.jpg
...
public/data/images/case346.jpg
```

如果你选择把这些图片一并提交到自己的公开仓库，请保留本署名说明，并遵守原项目许可证与素材声明。

## 名称说明

本项目使用开源名：

```txt
图像配方库 ImagePrompt Library
```

避免将第三方品牌名作为主产品名。项目可用于管理 GPT-Image、GPT-Image2、Seedream、ERNIE-Image、Midjourney、Stable Diffusion 等图像模型的提示词资产。
