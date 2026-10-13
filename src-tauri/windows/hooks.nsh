; 1up's installer, once its own files are in: the driver for virtual xbox pads (vigembus, by nefarius), unless it is
; there already. vigembus's own installer, shipped in drivers\ (fetch-driver.ps1), asks windows for the rights it
; needs, and windows names nefarius, who signed it. declined or failed, 1up still runs (keys need no driver) and
; offers to install it again

!macro NSIS_HOOK_POSTINSTALL
  ClearErrors
  ReadRegDWORD $0 HKLM "SYSTEM\CurrentControlSet\Services\ViGEmBus" "Type"
  ${If} ${Errors}
    DetailPrint "Installing the driver for virtual Xbox pads (ViGEmBus, by Nefarius)"
    ${If} ${Silent}
      ExecShellWait "runas" "$INSTDIR\drivers\vigembus-setup.exe" "/quiet /norestart" SW_HIDE
    ${Else}
      ExecShellWait "runas" "$INSTDIR\drivers\vigembus-setup.exe" "/quiet /norestart"
    ${EndIf}
    ClearErrors
    ReadRegDWORD $0 HKLM "SYSTEM\CurrentControlSet\Services\ViGEmBus" "Type"
    ${If} ${Errors}
      DetailPrint "The driver is not installed. 1up offers it again when it starts; keys work without it"
    ${Else}
      DetailPrint "The driver is installed"
    ${EndIf}
  ${Else}
    DetailPrint "The driver for virtual Xbox pads is installed already"
  ${EndIf}
!macroend
