@echo off
setlocal
cd /d "E:\Programing\E-commerce"
echo.
echo ========================================
echo Pushing to GitHub
echo ========================================
echo.

set GIT_EDITOR=true
git config --local core.editor "true"

echo Checking current branch...
git branch --show-current
echo.

echo Current status:
git status --short
echo.

echo Fetching from remote...
git fetch origin main
echo.

echo Force pushing to origin/main...
git push -f origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Code pushed to GitHub
    echo https://github.com/kamrul135/E-Commerce
    echo ========================================
) else (
    echo.
    echo ========================================
    echo FAILED! Please check errors above
    echo ========================================
)

echo.
pause
