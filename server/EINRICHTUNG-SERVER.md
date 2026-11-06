# Server einrichten (Login, Einladungscodes, Club-Claims)

Die App verwendet **Supabase** als Server. Das kostet für den Club-Test nichts.
Dauer: etwa 20 Minuten. Du brauchst nur den Browser, kein Terminal.

## 1. Konto und Projekt anlegen
1. <https://supabase.com> öffnen → **Start your project** → mit GitHub-Konto oder E-Mail registrieren.
2. **New project**:
   - Name: `mausibox`
   - Database Password: auf **Generate a password** klicken und das Passwort in deinem Passwort-Manager speichern (brauchst du fast nie)
   - Region: **West US (North California)** oder **East US** (nahe bei Arizona)
   - **Create new project**, dann 1–2 Minuten warten.

## 2. Datenbank einrichten
1. Links auf **SQL Editor** klicken → **New query**.
2. Die Datei `server/supabase-setup.sql` aus dem Projektordner öffnen, **alles** kopieren und einfügen.
3. Unten rechts **Run** klicken.
4. Unten erscheint **„Dein erster Einladungscode“**, z. B. `START-3F9A1C2B`. Diesen Code notieren.
   Wer sich als Erster damit registriert, wird automatisch **Superadmin** – also du.

## 3. Login-Einstellungen
Links **Authentication**:
1. **Sign In / Providers → Email**:
   - **Confirm email: AUS** (für die Testphase).
     Grund: Der eingebaute Mailversand von Supabase schickt nur an Mitglieder deines Supabase-Teams.
     Für echte Bestätigungs- und „Passwort vergessen“-Mails richten wir später einen Mail-Dienst ein (Schritt 7).
   - **Minimum password length: 8** → Save.
2. **URL Configuration**:
   - **Site URL**: die Adresse deiner App, z. B. `https://DEIN-NAME.github.io/goldclub-map/`
     (solange sie noch nicht online ist: `http://localhost:8000`)
   - **Redirect URLs → Add URL**: `http://localhost:8000/**` und später auch `https://DEIN-NAME.github.io/goldclub-map/**`

## 4. Schlüssel in die App eintragen
1. Links unten **Project Settings** (Zahnrad) → **API** bzw. **API Keys**.
2. Kopieren:
   - **Project URL** (z. B. `https://abcdefgh.supabase.co`)
   - den **anon / public** Schlüssel (unter „Legacy API keys“) oder den **publishable** Schlüssel
   - ⚠️ **Niemals** den `service_role`- oder `secret`-Schlüssel verwenden!
3. In `config.js` eintragen:
   ```js
   server: {
     supabaseUrl: "https://abcdefgh.supabase.co",
     supabaseAnonKey: "eyJhbGciOi…",
     publicUrl: ""
   },
   ```
   Wenn die App online ist, bei `publicUrl` ihre Adresse eintragen – sonst zeigen
   Einladungslinks, die du am Mac erstellst, auf `localhost`.

## 5. Dein Konto erstellen
1. App öffnen (lokal `http://localhost:8000`) → es erscheint der Anmeldebildschirm.
2. **Ich habe einen Einladungscode** → den START-Code eintragen, Benutzername, E-Mail, Passwort.
3. Danach Menü → dein Benutzername → **Verwaltung**.

## 6. Club anlegen und einladen
In der **Verwaltung**:
1. **＋ Neuer Club** → Name eingeben.
2. Karte auf das Club-Gebiet schieben → **Aktuellen Kartenausschnitt als Club-Start verwenden**.
3. **Club-Claim-Dateien → KML / GeoJSON hochladen**: eure Claims-Datei auswählen.
4. **Neuer Code**:
   - *Einzelcode*: für eine bestimmte Person (Notiz: ihr Name).
   - *Club-Code*: für mehrere Personen, z. B. 30 Stück für den Clubabend.
   - *Rolle Admin*: wer damit beitritt, darf den Club mitverwalten.
5. **QR / Link** → QR-Code zeigen, Link kopieren oder teilen.
6. **Privatpersonen** (ohne Club, sehen keine Club-Claims): in der Club-Auswahl
   **— Privatpersonen (ohne Club) —** wählen und dort Codes erstellen (nur Superadmin).

Wer schon ein Konto hat, kann unter Menü → Konto → **Weiteren Code einlösen** einem Club beitreten.

## 7. Später: E-Mails (Bestätigung, Passwort vergessen)
Damit „Passwort vergessen“ für alle funktioniert, braucht es einen Mail-Dienst, z. B. **Resend**
(gratis bis 3000 Mails/Monat) oder **Brevo**. In Supabase unter
**Authentication → Emails → SMTP Settings** eintragen. Das machen wir gemeinsam, wenn es so weit ist.
Bis dahin: Vergisst jemand sein Passwort, kannst du in Supabase unter
**Authentication → Users** das Konto löschen und ihm einen neuen Code geben.

## Wichtig
- Sobald der Server eingetragen ist, lädt die App die Club-Claims **nur noch vom Server**.
  Die Beispieldatei `data/club-claims/club-claims.kml` wird dann nicht mehr verwendet.
  **Echte Club-Claims nie in den Ordner `data/` legen**, wenn die App öffentlich auf GitHub liegt –
  dort könnte sie jeder herunterladen. Immer über die Verwaltung hochladen.
- Die Behördenkarten (BLM, USGS, Geologie) sind öffentliche Daten. Der Login schützt die
  Club-Claims, die Mitgliederlisten und später die Club-Punkte.
- Benutzer sperren: Verwaltung → **Alle Benutzer** → Sperren.
