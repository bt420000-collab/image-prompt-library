# ImagePrompt Library / 图像配方库

一个本地优先的 AI 图像提示词、案例图库和生成素材管理工具。项目用于整理图像生成案例、提示词模板、填空变量、图片/视频资产，并支持通过 UI 管理云端 API 与本地模型连接。

> 项目中文名：图像配方库  
> 作者：贝丝小草｜专注于解决问题的艺术  
> B 站主页 / 使用教学：https://space.bilibili.com/16826253  
> Product design, prompt curation and development assisted by ChatGPT.

<p align="center">
  <img src="./屏幕截图 2026-07-01 151114.png" alt="图像配方库案例展柜主界面" width="92%" />
</p>

<p align="center">
  <img src="./屏幕截图 2026-07-01 151206.png" alt="图像配方库大画布与生成面板" width="92%" />
</p>

## 项目定位

本项目不是 GPT-Image、GPT-Image2 或其他第三方模型的官方项目，也不把第三方模型名称作为产品主名。

`ImagePrompt Library / 图像配方库` 的定位是：

- 管理 AI 图像提示词和案例资产
- 把不同来源的优秀案例整理成本地可检索图库
- 支持提示词模板填空、标签检索、收藏、最近使用
- 支持图片组、视频案例、生成结果入库
- 支持桌面端使用，API Key 和本地模型路径通过 UI 设置维护

## 当前能力

- 案例图库：瀑布流卡片、详情工作台、大图预览、图片组管理
- 搜索筛选：标题、分类、标签、来源、提示词内容检索
- 标签系统：支持标准 `#标签` 玩法，可自由添加多个自定义标签
- 提示词管理：展示说明、填空模板、原始提示词、生成快照
- AI 补空：通过默认文本模型辅助补全模板变量
- 简单图像调整：一键调色、相机模拟、滑杆微调、保存和导出
- 视频案例支持：为 GPT Image 2 + Seedance 类工作流单独展示图片、提示词和视频资产
- 生成入库：生成结果保存到当前案例图片组，并记录模型、参数、seed、size
- 模型设置：左下角 UI 统一管理云端 API 与本地模型，不再要求把 API Key 写进 `.env`
- 桌面端：支持 Windows 桌面打包，用户数据与模型设置保存在本机

## 内置案例与 GitHub 来源

本项目内置案例库由多个公开 GitHub 项目/本地 GitHub 快照整理导入。导入后的数据结构、中文字段、标签、缩略图、视频资产展示和 UI 管理能力由本项目重新整理实现。

| 来源项目 | 本项目来源标识 | 导入数量 | 导入内容 |
| --- | --- | ---: | --- |
| `freestylefly/awesome-gpt-image-2` | `builtin` | 346 | GPT-Image2 提示词案例库基础数据 |
| `demo-gpt-image-2-main` | `gpt-image-2-demo-cn` | 65 | 中文 prompt 测评/demo 案例，全量导入 |
| `wuyoscar/GPT-Image2-Skill` | `gpt-image-2-skill-gallery` | 162 | GPT Image 2 Skill gallery/reference 案例，作为独立图库专区导入 |
| `GPT-Image-2-Seedance2-Workflow-main` | `gpt-image-2-seedance-workflow` | 26 | GPT Image 2 + Seedance 视频工作流案例，包含分镜、双提示词和视频资产位 |

已知完整链接：

- `freestylefly/awesome-gpt-image-2`: https://github.com/freestylefly/awesome-gpt-image-2
- `wuyoscar/GPT-Image2-Skill`: https://github.com/wuyoscar/GPT-Image2-Skill

其余三个新增来源是以本地 GitHub 项目快照目录导入：

- `GPT-Image2se/demo-gpt-image-2-main`
- `GPT-Image2se/GPT-Image-2-Seedance2-Workflow-main`

补充：`GPT-Image2-Skill-0.2.0.zip` 中包含 163 张图片，其中 162 张为图库案例图，另外 1 张是 `docs/assets/gptimage2skill-banner.png` 项目横幅图；本项目导入的是 162 条完整 gallery catalog 案例。

如果你公开发布包含这些导入数据的仓库，请保留本节和 [`ATTRIBUTION.md`](./ATTRIBUTION.md) 中的来源说明，并遵守原项目各自的许可证、素材声明和引用要求。

## 数据规模

当前桌面发布种子库包含：

- `builtin`: 346 个基础案例
- `gpt-image-2-demo-cn`: 65 个中文 demo 案例
- `gpt-image-2-skill-gallery`: 162 个 Skill 图库案例
- `gpt-image-2-seedance-workflow`: 26 个视频工作流案例

合计：599 个案例。

## 模型与 API 设置

项目已切换为 UI 统一管理模型连接，不再推荐通过 `.env` 写 API Key。

入口：

- 左侧主栏左下角：`模型设置`

设置分为两类：

- 文本模型：如 Ollama、OpenAI / compatible API
- 视觉模型：如 ERNIE Image、OpenAI Image、Seedance Video、stable-diffusion.cpp

保存位置：

- Web/源码运行：`data/model_settings.json`
- 桌面端：`%APPDATA%/image-prompt-library/data/model_settings.json`

说明：

- API Key、本地模型路径、本地可执行文件路径不会被打包进 installer
- 当前已接入运行链路：Ollama 文本补空、ERNIE Image 生成入库
- `stable-diffusion.cpp`、OpenAI Image、Seedance Video 的配置卡片已保留，执行器可继续扩展接入同一套路由池

## stable-diffusion.cpp 本地配置格式

模型设置里的 `stable-diffusion.cpp` 卡片按本地 CLI 调用思路设计，典型路径如下：

```powershell
$SD     = "C:\AI\stable-diffusion.cpp\sd-cli.exe"
$MODEL  = "C:\AI\models\ernie\ernie-image-turbo-Q8_0.gguf"
$VAE    = "C:\AI\models\ernie\vae\flux2-vae.safetensors"
$LLM    = "C:\AI\models\ernie\Ministral-3-3B-Instruct-2512-Q8_0.gguf"
```

UI 中对应字段：

- `sd-cli.exe 路径`
- `主模型 GGUF`
- `VAE 路径`
- `LLM / 提示词模型`
- 输出目录、宽高、steps、CFG、seed

## 启动开发环境

```bash
npm install
npm run dev
```

默认地址：

- 前端：http://localhost:5173
- 后端：http://localhost:3177

如果只打开 `http://localhost:3177` 看到 `Cannot GET /`，说明你打开的是后端地址。开发模式请打开前端地址。

## 构建

```bash
npm run build
npm start
```

## 桌面端发布

Windows 桌面构建文件位于：

```txt
release-desktop/
```

桌面端数据布局：

- 源码/Web 版：数据库和资源在仓库内的 `data/`、`uploads/`
- 桌面版：用户数据库、上传图片、生成图片保存在安装目录旁的 `library-data/`
- 桌面 API/model settings 保存在 `%APPDATA%/image-prompt-library/data/model_settings.json`

桌面端首次启动时，如果用户本地还没有数据库，会复制发布包中的种子案例库；已有数据库不会被覆盖。

## 导入脚本

项目保留了来源导入脚本，便于重新整理或追溯：

```txt
scripts/importGptImage2Demo.ts
scripts/importGptImage2SkillGallery.ts
scripts/importSeedanceWorkflow.ts
```

基础内置案例数据位于：

```txt
data/builtin/awesome_gpt_image_cases_v2_prompt_optimized_cn.json
```

## 技术栈

- Frontend: Vite + React + TypeScript
- Backend: Express + TypeScript
- Database: SQLite / better-sqlite3
- Upload: multer
- Image processing: sharp
- Desktop: Electron

## 发布前注意

- 不要提交真实 API Key
- 不要把个人 `data/model_settings.json` 中的密钥上传到公开仓库
- 如果发布包含导入图片/视频资产的版本，请确认原来源项目许可证和素材声明允许再分发
- `node_modules/`、本地构建产物、个人上传内容应保持在 `.gitignore` 管理范围内

## 版本记录

### v0.4.0 / 当前整理版

- 新增桌面端发布说明，明确源码版与桌面版的数据保存位置。
- 模型接入路线调整为 UI 模型设置，不再推荐通过 `.env` 写 API Key。
- 模型设置支持文本模型与视觉模型分组，预留云端 API 与本地模型统一路由池。
- 简单图像调整增加一键调色、相机模拟、保存和导出能力。
- 标签页改为标准 `#标签` 玩法，支持自定义多标签检索。

### v0.3.7 / 外部图库与视频工作流导入

- 全量导入 `demo-gpt-image-2-main`：65 条中文 demo / prompt evaluation 案例。
- 导入 `wuyoscar/GPT-Image2-Skill` gallery catalog：162 条 Skill 图库案例。
- 导入 `GPT-Image-2-Seedance2-Workflow-main`：26 条 GPT Image 2 + Seedance 视频工作流案例。
- 为视频工作流增加独立 UI 支持，区分普通图片案例与视频/分镜案例。
- 核对 `GPT-Image2-Skill-0.2.0.zip`：压缩包包含 163 张图片，其中 162 张为案例图，1 张为项目横幅图。

### v0.3.6 / 本地 AI 补空助手

- 在填空面板和大画布工作台中加入 AI 辅助补空。
- 默认支持 Ollama 文本模型，用于补全模板变量。
- AI 补空遵循当前案例的展示说明和用途，不直接改写整段提示词。
- 支持 AI 补空、关键词补空、同菜系随机、单变量补空。

### v0.3.2 / 生成入库

- 接入 ERNIE Image 生成入库链路。
- 新增 `POST /api/cases/:id/generate`。
- 生成图片自动下载到本地 uploads，并写入当前案例图片组。
- 图片资产记录独立名称、提示词快照、模型、参数、seed、size、来源和首图状态。

### v0.3.0 - v0.3.1 / 工作台与大画布

- 增加三栏式创作工作台。
- 案例详情从普通详情页升级为右侧工作台。
- 大图预览升级为大画布工作台。
- 增加收藏、最近使用、当前创作栏。
- 增加模板变量填空面板，为后续生成接口预留工作流。

### v0.2.6

- 精简 README，移除重复的作者与教学栏目。
- 优化左侧底部署名显示。

### v0.2.5

- 优化 UI。
- 增加教学和发布通道链接。

### v0.2.4

- 左侧标签改为图片主标签，只展示主类目。
- `综合应用 / 其他应用场景 / 稀奇古怪的小标签` 统一收进主标签 `趣味配方`。
- 点击 `趣味配方` 后才显示趣味子标签，避免左栏被小标签挤爆。

### v0.2.3

- 修复标签清洗正则换行导致后端无法启动的问题。
- 启动时清理孤儿标签，避免旧英文标签残留在统计里。

### v0.2.2

- 图片标签新增规范化清洗。
- 同义项自动归并，例如 UI 相关标签统一为 `UI界面`。
- 左侧标签区只展示清洗后的中文标签。
- 旧库启动时会自动重建一次案例标签。

## License

本项目代码按仓库中的 [`LICENSE`](./LICENSE) 发布。内置/导入案例素材和提示词来源请同时参考 [`ATTRIBUTION.md`](./ATTRIBUTION.md)。
