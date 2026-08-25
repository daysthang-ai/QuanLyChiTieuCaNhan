Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Check if venv python exists
strPython = strDir & "\venv\Scripts\python.exe"
strRunPy = strDir & "\run.py"

If fso.FileExists(strPython) Then
    WshShell.Run """" & strPython & """ """ & strRunPy & """", 1, False
Else
    WshShell.Run "python """ & strRunPy & """", 1, False
End If
