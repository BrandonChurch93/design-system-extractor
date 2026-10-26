# @design-system-extractor/mcp

An MCP server for one Design System Extractor run: tokens, components, checks, drift and a prompt, over stdio.

```
claude mcp add design-system-extractor -- npx -y @design-system-extractor/mcp --run {id}
```

Point it at a run with `--run {id}`, `--url {run link}` or `--file ./run.json`. It reads the run once and never writes to disk.

Tools: `get_tokens` · `list_components` · `get_component` · `get_checks` · `get_drift` · `get_prompt`. Resources: `dse://run/{id}/design-system.md` and `dse://run/{id}/tokens.css`.

MIT license.
