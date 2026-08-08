@echo off
chcp 65001 >nul
echo ==============================================
echo     高考志愿填报APP - 后端服务启动器
echo ==============================================
echo.

:: 检查PowerShell是否可用
where powershell >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: 未找到PowerShell，请确保使用Windows 10或更高版本
    pause
    exit /b 1
)

:: 检查脚本文件是否存在
if not exist "%~dp0start_server.ps1" (
    echo 错误: 未找到 start_server.ps1 文件
    pause
    exit /b 1
)

:: 使用PowerShell执行启动脚本
powershell -ExecutionPolicy Bypass -File "%~dp0start_server.ps1"

pause
