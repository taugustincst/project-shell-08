# Lessons (corrections hit while building)

- Local network ports are denied in this sandbox: drive Playwright over file:// instead of a local server.
- CSS transform animations override an SVG element's transform attribute: wrap the animated element in a <g> that carries the attribute.
- A planted corrupt save is overwritten by the pagehide save on reload: plant it with page.addInitScript in a fresh context.
- GitHub Pages must be enabled by Tj (Settings → Pages → Source: GitHub Actions); the workflow token cannot create the site. Log it FOR TJ.
- A "last resort" commission builder must only use the reference layers the player owns, or the game asks for deductions the atlas cannot support; targets that cannot be resolved with the owned layers must be excluded from selection rather than served.
- Another agent (Folder) pushes to these repos concurrently (Pages workflow, placeholder index.html). Before merging: fetch origin main, merge main into the branch (never force-push or reset), keep Folder's pages.yml and HANDOFF line, make sure the game's index.html wins over any placeholder, then fast-forward main.
- On shell-08 the merge conflicted on index.html (placeholder vs game) and HANDOFF.md (log lines); resolved by taking the game's index.html and keeping both log lines in date order.
