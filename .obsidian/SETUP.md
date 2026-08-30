# Vault setup (new developers)

This folder **is** the knowledge vault: architecture decisions, established patterns,
known issues, and dead ends. The notes are committed; Obsidian itself and the MCP
Connector plugin are not — each developer installs those on their own machine, once.

Claude reaches the vault **only** through the MCP server described below. There is no
filesystem fallback, so if you skip this setup Claude works without the vault.

## 1. Install Obsidian

Desktop app, from <https://obsidian.md>. The MCP Connector plugin is desktop-only —
Obsidian Mobile will not serve it.

## 2. Open this folder as a vault

In Obsidian: **Open folder as vault** → select `<repo>/.obsidian`.

It is a hidden folder, so the file picker may not list it. Paste the full path into the
dialog's path field instead, e.g. `C:\path\to\beeracademy\.obsidian`.

Obsidian then keeps its own config in `<repo>/.obsidian/.obsidian/` — the nested folder
is expected, not a mistake. It is gitignored: it holds per-machine UI state, your bearer
token, and a 3 MB plugin binary — none of which belong in the repo.

## 3. Enable the MCP Connector plugin

The plugin is **not** committed — install it yourself, once per machine.

1. **Settings → Community plugins** → turn off **Restricted mode** if it is on.
2. **Browse** → search for **MCP Connector** (by Stefano Ferri, plugin id
   `mcp-tools-istefox`) → **Install**, then **Enable**. Desktop only.
3. Open its settings and note the **port** (`27200`). Generate a **bearer token** if the
   plugin has not made one already, and copy it — you need it in step 4.

The plugin keeps its token in `data.json`, which is **not** committed (it is gitignored):
tokens are per-developer, not shared. A fresh clone therefore starts without one, which is
why you generate it here.

## 4. Register the server in Claude Code

Add to the `mcpServers` block of your `~/.claude.json` (Windows: `C:\Users\<you>\.claude.json`),
substituting the token from step 3:

```json
"obsidian": {
  "type": "http",
  "url": "http://127.0.0.1:27200/mcp",
  "headers": {
    "Authorization": "Bearer <your-token>"
  }
}
```

Restart Claude Code afterwards so it picks up the new server.

## 5. Verify

Run `/mcp` in Claude Code — `obsidian` should show as connected. Then ask Claude
for a vault overview; it should report ~19 notes across `decisions/`, `patterns/`,
`context/`, `dead-ends/`, and `code-review/`.

## Troubleshooting

**`Unable to connect. Is the computer able to access the url?`** — the server is not
listening. In order of likelihood:

1. Obsidian is not running. The plugin only serves while the app is open; keep it running
   in the background while you work.
2. Obsidian is open on a *different* vault. Plugins are per-vault — switch to this one.
3. The plugin is disabled, or Restricted mode is back on.
4. The server is up but Claude Code's connection died (common after Obsidian restarts or
   the vault moves). Run `/mcp` and reconnect — this fixes it without restarting anything.

**Token mismatch** — if the plugin's token was regenerated, update the `Authorization`
header in `~/.claude.json` to match.

## Where to look once it works

- `rules.md` — codebase conventions, each with a runnable check. Outranks `CLAUDE.md`.
- `known-issues.md`, `security-issues.md` — current known problems.
- `context/project-beeracademy.md` — project state.
- `decisions/` — ADRs with rationale. `patterns/` — established conventions.
- `dead-ends/_index.md` — approaches already tried and rejected. Read before proposing one.

## Note on the token

The plugin stores its bearer token in plain text in
`.obsidian/.obsidian/plugins/mcp-tools-istefox/data.json`, which the `.obsidian/.obsidian/`
ignore rule covers. Keep it that way — GitHub push protection blocks any push carrying it, and it is a live
credential regardless of how narrowly the server binds.

Committing it bought little in the first place: step 4 has you paste the token into your own
`~/.claude.json` by hand, so a shared token saved exactly one copy-paste of a value you have
to handle anyway.
