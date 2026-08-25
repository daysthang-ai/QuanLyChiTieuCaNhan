Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)
strDesktop = WshShell.SpecialFolders("Desktop")

strPython = strDir & "\venv\Scripts\python.exe"
strRunPy = strDir & "\run.py"

' 1. Create Desktop Shortcut
Set oLink = WshShell.CreateShortcut(strDesktop & "\FinTrack AI.lnk")
If fso.FileExists(strPython) Then
    oLink.TargetPath = strPython
    oLink.Arguments = """" & strRunPy & """"
Else
    oLink.TargetPath = "python.exe"
    oLink.Arguments = """" & strRunPy & """"
End If
oLink.WorkingDirectory = strDir
oLink.Description = "He Thong Quan Ly Chi Tieu FinTrack AI"
oLink.Save

' 2. Create Project Folder Shortcut
Set oLink2 = WshShell.CreateShortcut(strDir & "\KhoiChay_FinTrack.lnk")
If fso.FileExists(strPython) Then
    oLink2.TargetPath = strPython
    oLink2.Arguments = """" & strRunPy & """"
Else
    oLink2.TargetPath = "python.exe"
    oLink2.Arguments = """" & strRunPy & """"
End If
oLink2.WorkingDirectory = strDir
oLink2.Description = "He Thong Quan Ly Chi Tieu FinTrack AI"
oLink2.Save

WScript.Echo "Da tao xong Shortcut 'FinTrack AI' tren Desktop va trong thu muc du an! Ban chi can click dup vao shortcut de chay web."
