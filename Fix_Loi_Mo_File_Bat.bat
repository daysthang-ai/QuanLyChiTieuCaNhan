@echo off
chcp 65001 > nul
title Khoi Phuc Mac Dinh Chay File .bat va .cmd
echo Dang khoi phuc lien ket file Windows...
assoc .bat=batfile
ftype batfile="%1" %*
assoc .cmd=cmdfile
ftype cmdfile="%1" %*
echo.
echo [OK] Da khoi phuc thanh cong! Gio ban co the click dup vao file .bat / .cmd de chay truc tiep.
pause
