@echo off
echo Syncing project with GitHub...
git add .
git commit -m "daily backup %date% %time%"
git push
echo Sync complete!
pause
