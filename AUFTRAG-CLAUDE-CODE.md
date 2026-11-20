# Auftrag für Claude Code: Upload-Fehler beheben

Der Upload zu Hoststar scheiterte mit „no matching host key type found. Their offer: ssh-rsa“.
1. Ersetze `.github/workflows/deploy-hoststar.yml` durch `tools/deploy-hoststar.yml` (neu: ssh-rsa erlauben, Timeout 30 s).
2. Lösche danach `tools/deploy-hoststar.yml` und diese Datei, committe und pushe.
3. Prüfe unter GitHub → Actions „Zu Hoststar hochladen“, ob der Lauf grün wird.
