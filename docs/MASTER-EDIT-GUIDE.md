# MASTER EDIT GUIDE

## One source of truth

Use this master project as the baseline for every future change.

## Common edits

### Birthday date
`js/config.js`
Change:
`birthday`

### YouTube video
`js/config.js`
Change only:
`youtubeVideo.url`

Set:
`youtubeVideo.enabled = false`
to hide the video.

### Birthday music
File:
`music/birthday.mp3`

The JavaScript music system lives in:
`js/main.js`

Keep one `#birthdayAudio` element per HTML page.

### Memory images
Folder:
`images/memories/`

Current mapping:
- memory-01.png
- memory-02.png
- memory-03.png
- memory-04.png
- our-journey.png

The mapping is defined in:
`js/media-data.js`

### Story images
Folder:
`images/story/`

Current mapping:
- chapter-01.png
- chapter-02.png
- chapter-03.png
- chapter-04.png

The text + mapping live in:
`js/media-data.js`

### Memory gallery behavior
`js/memories.js`

### Global site behavior
`js/main.js`

### Site styling
`css/style.css`

### Memories styling
`css/memories.css`

### Story styling
`css/story.css`

## Before any future release

1. Start from this master ZIP.
2. Make the smallest change necessary.
3. Run JavaScript syntax checks.
4. Run PHP syntax checks.
5. Check all HTML local asset references.
6. Open Home, Memories, Story, Surprise and Fun Zone manually on a real device.
7. Confirm music, navigation, lightbox, games and forms.
8. Keep the final ZIP as the new master.

Do not combine this project with an older ZIP.
