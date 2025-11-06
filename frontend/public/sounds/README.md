# Notification Sound

## Required File

Place a notification sound file at:
```
/public/sounds/notification.mp3
```

## Recommendations

- **Format**: MP3 (best browser support)
- **Duration**: 0.5-1 second
- **Volume**: Moderate (will be set to 50% in code)
- **File size**: < 50KB

## Alternative Formats

You can also use:
- `notification.ogg` (Firefox, Chrome)
- `notification.wav` (All browsers, but larger file size)

## Free Sound Resources

- [Notification Sounds](https://notificationsounds.com/)
- [Freesound.org](https://freesound.org/browse/tags/notification/)
- [Zapsplat](https://www.zapsplat.com/sound-effect-categories/)

## Custom Sound

For a custom notification sound, ensure:
1. Clear, pleasant tone
2. Not too loud or jarring
3. Distinct from system sounds
4. Quick duration

## Testing

To test the notification sound:
1. Place the sound file in this directory
2. Enable sound in NotificationBell component
3. Trigger a new notification
4. Check browser console for any playback errors
