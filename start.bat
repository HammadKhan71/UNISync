@echo off
title UniSync Launcher
echo ========================================================
echo                 Starting UniSync
echo ========================================================
echo.

echo [1/3] Downloading/Updating dependencies (please wait)...
cd server
call npm install --silent

echo.
echo [2/3] Starting backend data server...
:: This opens the backend server in a separate background window
start "UniSync Server API" cmd /k "npm start"

echo.
echo [3/3] Launching your web browser...
cd ..
:: Wait 3 seconds to ensure the server is fully awake
ping 127.0.0.1 -n 4 > nul
start "" "login.html"

echo.
echo ✅ ALL DONE! 
echo The website should be open in your browser.
echo Keep the new black terminal window open while using the app!
echo.
pause
