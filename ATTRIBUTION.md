# Attribution / 素材与来源说明

`ImagePrompt Library / 图像配方库` 是一个用于管理 AI 图像提示词、案例图库和生成资产的本地工具。

本项目代码、数据结构、UI、导入整理脚本、桌面端封装和模型设置连接池由本项目实现。内置案例、参考提示词、图片/视频素材来自公开 GitHub 项目或本地 GitHub 快照整理导入，需保留来源说明。

## 内置与导入来源

| 来源项目 | GitHub / 来源说明 | 本项目来源标识 | 导入数量 | 用途 |
| --- | --- | --- | ---: | --- |
| `freestylefly/awesome-gpt-image-2` | https://github.com/freestylefly/awesome-gpt-image-2 | `builtin` | 346 | 基础 GPT-Image2 提示词案例库 |
| `demo-gpt-image-2-main` | 本地 GitHub 快照：`GPT-Image2se/demo-gpt-image-2-main` | `gpt-image-2-demo-cn` | 65 | 中文 prompt 测评/demo 案例 |
| `wuyoscar/GPT-Image2-Skill` | https://github.com/wuyoscar/GPT-Image2-Skill | `gpt-image-2-skill-gallery` | 162 | GPT Image 2 Skill gallery/reference 图库 |
| `GPT-Image-2-Seedance2-Workflow-main` | 本地 GitHub 快照：`GPT-Image2se/GPT-Image-2-Seedance2-Workflow-main` | `gpt-image-2-seedance-workflow` | 26 | GPT Image 2 + Seedance 视频工作流案例 |

## 关于新增三个来源项目

本项目新增导入的三个 GitHub 项目来源为：

1. `demo-gpt-image-2-main`
   - 导入脚本：`scripts/importGptImage2Demo.ts`
   - 导入结果：65 条中文 demo / prompt evaluation 案例
   - 本项目来源标识：`gpt-image-2-demo-cn`

2. `wuyoscar/GPT-Image2-Skill`
   - 导入脚本：`scripts/importGptImage2SkillGallery.ts`
   - 导入结果：162 条 GPT Image 2 Skill gallery/reference 案例
   - 本项目来源标识：`gpt-image-2-skill-gallery`
   - UI 处理：作为独立图库来源保留，不强行混入基础库语义
   - 来源链接：https://github.com/wuyoscar/GPT-Image2-Skill
   - 0.2.0 zip 核对：压缩包含 163 张图片，其中 162 张是图库案例图，另 1 张是 `docs/assets/gptimage2skill-banner.png` 项目横幅图

3. `GPT-Image-2-Seedance2-Workflow-main`
   - 导入脚本：`scripts/importSeedanceWorkflow.ts`
   - 导入结果：26 条 GPT Image 2 + Seedance 视频工作流案例
   - 本项目来源标识：`gpt-image-2-seedance-workflow`
   - UI 处理：按视频/工作流案例展示，保留 GPT Image 2 prompt、Seedance prompt、分镜图和视频资产位置

## 使用与再发布说明

- 本项目对导入案例进行了结构化整理、中文字段整理、标签归类、资源复制和 UI 展示适配。
- 导入案例、图片、视频、原始 prompt 或参考说明的权利归原来源项目及其贡献者所有。
- 如果你 fork、二次发布或公开分发包含这些导入案例/素材的版本，请保留本文件。
- 如果你同时发布图片或视频资产，请先确认原来源项目许可证、素材声明和引用要求允许再分发。
- 如果你只发布本项目代码而不发布导入素材，仍建议保留本文件说明数据来源和导入脚本用途。

## 名称说明

本项目使用开源名：

```txt
ImagePrompt Library / 图像配方库
```

项目可用于管理 GPT-Image、GPT-Image2、Seedance、Seedream、ERNIE Image、Midjourney、Stable Diffusion 等模型相关的提示词资产，但本项目不是这些模型或品牌的官方项目。

## 作者与教程

```txt
贝丝小草｜专注于解决问题的艺术
```

B 站主页：

```txt
https://space.bilibili.com/16826253
```
