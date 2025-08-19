
# Enkel statisk side

Dette er en forenklet, statisk versjon av prosjektet – klar for GitHub Pages.

## Slik publiserer du på GitHub Pages

1. Opprett et **public** repository på GitHub (f.eks. `eivind-site`).
2. Last opp innholdet i denne mappen (filene `index.html`, `style.css`, mappen `img/` og `js/`).
3. Kjør disse kommandoene lokalt i terminalen i mappen:
   ```bash
   git init
   git add .
   git commit -m "Initial static site"
   git branch -M main
   git remote add origin https://github.com/<brukernavn>/<repo>.git
   git push -u origin main
   ```
4. I GitHub: Gå til **Settings → Pages**.
   - Under **Build and deployment**, sett **Source** til "Deploy from a branch".
   - Velg **Branch**: `main` (og `/ (root)` som mappe).
   - Trykk **Save**.
5. Vent litt, så blir siden tilgjengelig på: `https://<brukernavn>.github.io/<repo>/`

## Endre innhold
- **Bilder**: legg til eller bytt ut filer i `img/`-mappen.
- **Erfaringer**: ligger statisk i HTML-en (seksjonen «Mine erfaringer»). Du kan redigere der,
  eller endre `experiences.json` og regenerere HTML senere.
