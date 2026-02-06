@echo off
echo This will reset PostgreSQL password. Run as Administrator.
echo.
echo Stopping PostgreSQL service...
net stop postgresql-x64-18
echo.
echo Starting PostgreSQL in single-user mode...
"C:\Program Files\PostgreSQL\18\bin\postgres.exe" --single -D "C:\Program Files\PostgreSQL\18\data" postgres -c "ALTER USER postgres WITH PASSWORD '265249';"
echo.
echo Starting PostgreSQL service...
net start postgresql-x64-18
echo.
echo Password reset complete!
pause