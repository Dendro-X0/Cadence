@echo off
setlocal enabledelayedexpansion
REM Attempt to locate Visual Studio installation using vswhere
set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
set "VSINST="
if exist %VSWHERE% (
  for /f "usebackq delims=" %%i in (`"%VSWHERE%" -latest -products * -requires Microsoft.Component.MSBuild -property installationPath`) do set "VSINST=%%i"
)
if defined VSINST (
  echo Using Visual Studio at: "%VSINST%"
  call "%VSINST%\Common7\Tools\VsDevCmd.bat" -arch=x64
) else (
  echo Could not locate Visual Studio with vswhere. If this fails, run from "x64 Native Tools Command Prompt for VS 2022".
)
REM Change directory to repo root relative to this script
pushd "%~dp0..\..\"
REM Start Tauri dev (expects Vite dev server at http://localhost:5173)
npm --workspace apps/desktop run tauri dev
popd
endlocal
