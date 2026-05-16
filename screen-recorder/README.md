# Screen Recorder

Native macOS menu bar app that captures the screen at 2 fps once you "log in"
as one of the hardcoded users.

## Requirements

- macOS 14 or later (ScreenCaptureKit `SCScreenshotManager`)
- Xcode command line tools / Swift 5.9+

## Build & run

```sh
cd screen-recorder
swift run
```

The binary lives at `.build/debug/screen-recorder`. On first launch macOS will
prompt for **Screen Recording** permission — grant it in
*System Settings → Privacy & Security → Screen Recording*, then relaunch.

## Use

1. Click the record icon in the menu bar.
2. *Log In →* pick **Tomer Moran** or **Elith Palomino**.
3. *Start Recording*. The icon turns into a red dot.
4. *Stop Recording* to end the session.

Frames are saved at 2 fps as PNGs to:

```
~/Movies/ScreenRecorder/session_<YYYY-MM-DD_HH-mm-ss>/frame_<index>_<timestamp>.png
```

Use *Open Recordings Folder* in the menu to jump there in Finder.
