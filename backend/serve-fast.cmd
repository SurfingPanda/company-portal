@echo off
rem Starts the API for local development with PHP's opcache turned on (faster per request than "php artisan serve", which runs
rem without it on this machine). Usage:  serve-fast.cmd [port]   (default 8001)
rem Laravel reads backend\.env itself, so there is nothing else to configure. Press Ctrl+C to stop.
set PORT=%1
if "%PORT%"=="" set PORT=8001
rem The router script serves from the current directory, so it must be the public folder.
cd /d "%~dp0public"
php -d zend_extension=opcache -d opcache.enable=1 -d opcache.enable_cli=1 -d opcache.revalidate_freq=2 -d opcache.memory_consumption=128 -d opcache.max_accelerated_files=10000 -S 127.0.0.1:%PORT% -t . ..\vendor\laravel\framework\src\Illuminate\Foundation\resources\server.php
