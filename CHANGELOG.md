# CHANGELOG

## MASTER FINAL 2.0 — 2026-10-05

- Consolidated the latest submitted final ZIP into a single master release.
- Preserved the supplied 4 Memory images, 19-moment Our Journey collage and 4 Story collages.
- Finalized the birthday music player with 100% default volume, loop, saved volume/mute, playback position and navigation-safe state persistence.
- Added a public music-state bridge so internal navigation persists playback intent before page teardown.
- Added internal-link prefetching to reduce page transition latency.
- Hardened the global loader so an optional script failure cannot permanently trap the site behind the intro.
- Hardened the Memories renderer with better empty/error states, eager first images, lazy later images, focus restoration and safer lightbox media handling.
- Added favicon, web manifest, 404 page and static-asset service worker.
- Added master QA and edit documentation.
- Verified JavaScript syntax, PHP syntax, HTML local references, script order, audio count, music source, image decoding and music media metadata.
