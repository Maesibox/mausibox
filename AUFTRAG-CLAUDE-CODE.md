# Auftrag für Claude Code: Automatischer Upload zu Hoststar

1. Verschiebe `tools/deploy-hoststar.yml` nach `.github/workflows/deploy-hoststar.yml` (Inhalt unverändert lassen), committe und pushe.
2. Der Workflow braucht zwei GitHub-Secrets (Marcel trägt sie im Browser ein, nicht im Code):
   `HOSTSTAR_SFTP_USER` und `HOSTSTAR_SFTP_PASSWORD`.
3. Danach diese Datei löschen.
