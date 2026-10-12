# GAGA 0.0.40.2

## Breaking + Live Coverage Foundation

### Added
- normalized standard/breaking/live coverage authority
- active/paused/ended coverage lifecycle
- structured coverage update timeline metadata
- deterministic global active-coverage promotion
- breaking/live coverage strip
- article coverage timeline
- shell coverage data contract
- coverage metadata in the document head
- coverage projection into search/machine discovery
- coverage policy-as-code and source audit

### Compatibility
Existing `breaking` and `live` article booleans remain valid compatibility aliases.

### Boundary
This iteration is static-first. Live coverage does not claim realtime streaming transport. Coverage updates publish through the normal build/deploy lifecycle.
