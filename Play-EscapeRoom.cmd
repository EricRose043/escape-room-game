@echo off
chcp 65001 >nul
cd /d "%~dp0"
python -X utf8 "%~dp0play_escape_room.py"
if errorlevel 1 pause
