# Khushi Birthday — MASTER FINAL

This is the consolidated master build for the Khushi birthday website.

## Stack

- HTML5 / CSS3
- Vanilla JavaScript ES6+
- GSAP enhancement where already used
- PHP 8+
- MySQL / MariaDB
- PDO / Fetch API

## Master assets

- 4 personal Memory images
- 1 complete 19-moment Our Journey collage
- 4 personal Story chapter collages
- 1 birthday soundtrack (`music/birthday.mp3`)
- configurable YouTube video
- favicon / web manifest
- offline static-asset service worker
- GitHub Pages `404.html`

## Important

Do not use an older ZIP as the base for future changes.

Use `docs/MASTER-EDIT-GUIDE.md` for the approved change points and `docs/MASTER-QA-REPORT.md` for the release audit.

## GitHub Pages

The frontend works as a static site on GitHub Pages.

PHP/MySQL files are included, but GitHub Pages does not execute PHP. Use PHP-capable hosting for the Message Wall backend/admin.

## Music

The player defaults to 100% volume, loops the single soundtrack, remembers volume/mute and playback state, and restores the previous position after page navigation when browser policy allows.

## Final note on ZIP size

The release is intentionally not padded with meaningless duplicate files. Size is driven by real media and useful functionality rather than filler.
