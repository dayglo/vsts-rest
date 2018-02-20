#test install script
write-host "installing package to inetpub directory"
write-host $MyInvocation.MyCommand.Path
copy-item .\package.zip C:\inetpub\package.zip
