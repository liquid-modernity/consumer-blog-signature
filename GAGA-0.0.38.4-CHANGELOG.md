# GAGA 0.0.38.4

## Search + Machine Discovery Foundation

This iteration extracts the generic discovery architecture from the Rempah Ruah donor system without transplanting buyer, sourcing, product, or commercial domain semantics.

### Added
- shared public discovery projection
- versioned rich search-index schema with backward-compatible `items`
- `/machine.json` project-defined machine-readable publication index
- `/agent.json` project-defined descriptive capability surface
- `/llms.txt` informational discovery guidance
- discovery endpoint advertisements in the document head
- discovery policy-as-code and source audit

### Boundaries
- machine and agent surfaces are projections of public content, not new content authority
- `agent.json` is descriptive and read-only
- no autonomous publishing, editing, submission, or consequential action authority
- `llms.txt` is treated as informational, not claimed as a formal web standard
- live endpoint correctness still requires generated/deployed evidence

### Compatibility
`/search-index.json` keeps the existing `items` array consumed by the current Search UI and adds richer `records` for future GAGA search providers.
