@echo off
echo 正在为您启动小说工坊...

:: 这一步确保在当前文件夹内运行
cd /d "%~dp0"

:: 启动网页浏览器打开目标地址
start http://localhost:5173/

:: 执行 npm 启动命令，保持窗口开启
bun run dev

pause