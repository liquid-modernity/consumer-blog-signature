# Dynamic Super Share Runtime Adapter Migration v0.1

## Namespace Decision

Previous:
@gaga/share-engine

Target:
@gaga/super-share

Rationale:
The @gaga namespace already represents the engine ecosystem.

## Runtime Boundary

Consumer application:
    consumer-blog-signature

          |

          v

    @gaga/super-share

          |
          +-- resolver
          +-- machine
          +-- renderer
          +-- adapters
          +-- analytics

## Migration Rule

Product routes should consume contracts, not own share behavior.
