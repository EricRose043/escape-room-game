@echo off
cd /d "%~dp0"
python "%~dp0play_escape_room.py"
if errorlevel 1 pause
