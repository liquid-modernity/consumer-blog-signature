# Dynamic Super Share Engine Extraction Package v0.1

## Objective

Move Dynamic Super Share from application-specific feature space into a reusable engine module.

## Extraction Boundary

The engine must not depend on:
- article routes
- markdown renderer
- CMS implementation
- blog-specific state

## Core Contract

ShareContext:
- title
- url
- author
- image
- contentType
- readingProgress
- shareState

## Package Structure

share-engine/
- core/
- contracts/
- renderer/
- adapters/
- machine/
- analytics/
- accessibility/
- index.ts
