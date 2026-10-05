# Khushi Birthday — Final Production Build

Version **1.1.0** · Personal media + configurable video integrated

## Final media
- 4 individual Memory images
- 1 complete 19-moment **Our Journey** collage as one featured memory
- 4 complete Story chapter collages

The supplied personal image files are copied into the project without resizing or re-encoding.

## Story text
The four approved Story chapter texts are preserved exactly in `js/media-data.js`.

## YouTube video
A temporary YouTube video is embedded on the Story page. To replace it later, change only this value:

`js/config.js` → `youtubeVideo.url`

The renderer accepts normal YouTube watch links, youtu.be links, or embed/shorts links and converts them to a privacy-enhanced embed. Invalid/blank links fail gracefully without breaking the page.

## Music
`music/birthday.mp3` remains the single birthday soundtrack. The player respects browser autoplay rules and loops after the user starts playback.

## GitHub Pages
The frontend is compatible with GitHub Pages. PHP/MySQL message/admin features require PHP-capable hosting; GitHub Pages does not execute PHP.

## QA
See `FINAL-QA-REPORT.md` for the integrated static and local runtime checks.
