# Dual N-Back Brain Training

A web-based implementation of the Dual N-Back cognitive training exercise, designed to improve working memory and fluid intelligence.

## What is Dual N-Back?

Dual N-Back is a scientifically-backed cognitive training exercise where you simultaneously track two sequences:
- **Visual positions**: A square appearing in different locations on a grid
- **Audio letters**: Spoken letters (C, H, K, L, Q, R, S, T)

Your task is to identify when the current stimulus matches the one presented **N steps back** in the sequence.

## Features

### Core Gameplay
- Clean, modern 3×3 grid interface (customizable to 2×2 or 4×4)
- Web Speech API for high-quality text-to-speech audio
- Keyboard controls (A for audio match, L for position match)
- Touch-friendly mobile controls
- Real-time scoring and performance tracking

### Progress Tracking
- Detailed session statistics (accuracy, hits, misses, false positives)
- Historical data with last 10 sessions
- Automatic level progression based on performance
- LocalStorage persistence (your data never leaves your device)

### Customization
- Adjustable N-level (1-5)
- Grid size options (2×2, 3×3, 4×4)
- Session length (15, 20, 25, or 30 trials)
- Stimulus timing (2.0 - 3.5 seconds)
- Audio volume and speech rate controls

### Cross-Platform
- **Desktop**: Works in Chrome, Safari, Firefox, Edge
- **Tablet**: Optimized for iPad
- **Mobile**: Fully responsive with touch controls

## How to Use

### Quick Start
1. Open `index.html` in a web browser
2. Click "Start Training" to begin
3. Watch the grid and listen to the letters
4. Press `A` when the current letter matches N steps back
5. Press `L` when the current position matches N steps back

### Keyboard Controls
- `A` - Audio match
- `L` - Position match
- Press both keys if both match simultaneously

### Mobile Controls
- Tap the "Audio Match" button when the letter matches
- Tap the "Position Match" button when the position matches

### Level Progression
The game automatically adjusts difficulty:
- **Score > 80%**: Level increases (more challenging)
- **Score < 50%**: Level decreases (easier)
- **Score 50-80%**: Level stays the same

## Installation

### Local Installation
1. Download or clone this repository
2. Open `index.html` in your web browser
3. No build process or dependencies required!

### Mobile/iPad Installation
1. Open `index.html` in Safari (iOS) or Chrome (Android)
2. For iOS: Tap Share → Add to Home Screen
3. The app will work offline once loaded

### Running from a Server
If you want to run from a local server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using PHP
php -S localhost:8000

# Using Node.js (with http-server)
npx http-server
```

Then open `http://localhost:8000` in your browser.

## File Structure

```
DualN-back/
├── index.html          # Main HTML structure
├── styles.css          # Responsive CSS styling
├── game.js             # Game logic and state management
└── README.md           # This file
```

## Browser Compatibility

### Desktop
- ✅ Chrome 90+
- ✅ Safari 14+
- ✅ Firefox 88+
- ✅ Edge 90+

### Mobile
- ✅ iOS Safari 14+
- ✅ Chrome for Android 90+

**Note**: Web Speech API is required for audio. Most modern browsers support this, but voice quality may vary by platform.

## Tips for Effective Training

1. **Start Easy**: Begin with 2-Back and let the game adjust to your level
2. **Stay Consistent**: Daily 20-minute sessions are more effective than occasional long sessions
3. **Focus**: Find a quiet environment and minimize distractions
4. **Don't Rush**: Wait for the audio before responding
5. **Be Patient**: Improvement takes time - most people see results after 2-3 weeks of regular practice

## Privacy & Data

- **100% Local**: All data is stored in your browser's LocalStorage
- **No Analytics**: No tracking, cookies, or external requests
- **No Account**: No login or personal information required
- **Offline Capable**: Works without internet (after initial load)

## Settings

Access settings from the main menu to customize:

### Difficulty Settings
- **Starting N-Level**: Choose your initial difficulty (1-5)
- **Grid Size**: Change grid dimensions (2×2, 3×3, 4×4)
- **Trials per Session**: Adjust session length (15-30 trials)
- **Stimulus Interval**: Time between stimuli (2.0-3.5 seconds)

### Audio Settings
- **Volume**: Adjust speech volume (0-100%)
- **Speech Rate**: Change speaking speed (Slow, Normal, Fast)

### Data Management
- **Reset Statistics**: Clear all saved session data

## Troubleshooting

### No Audio
- **Check browser support**: Web Speech API is required
- **Enable audio**: Make sure your device isn't muted
- **Browser permissions**: Some browsers require user interaction before playing audio
- **Try different browsers**: Safari and Chrome have the best speech synthesis support

### Performance Issues
- **Close other tabs**: Free up system resources
- **Reduce grid size**: Try 2×2 instead of 4×4
- **Increase interval**: Use 3.5 seconds between stimuli

### Data Not Saving
- **Check LocalStorage**: Make sure your browser allows LocalStorage
- **Private/Incognito mode**: Data may not persist in private browsing
- **Clear browser data**: Don't clear site data if you want to keep statistics

## Scientific Background

The Dual N-Back task has been studied extensively as a method for improving fluid intelligence and working memory:

- Based on research suggesting working memory training can improve cognitive abilities
- Requires simultaneous processing of visual and auditory information
- Adaptive difficulty ensures optimal cognitive load
- Most effective when practiced regularly (20 minutes/day recommended)

**Note**: While research shows promise, results vary by individual. This tool is for cognitive training and entertainment, not medical purposes.

## Development

Built with vanilla JavaScript, HTML5, and CSS3:
- No frameworks or dependencies
- Clean, readable code
- Easy to modify and extend
- Mobile-first responsive design

### Future Enhancement Ideas
- Triple N-Back mode (add color dimension)
- Progressive Web App (PWA) support
- Export statistics to CSV
- Multiple language support
- Alternative audio letter sets
- Advanced statistics and graphs

## License

This is a free, open-source implementation inspired by the Brain Workshop project. Feel free to use, modify, and distribute.

## Credits

Inspired by [Brain Workshop](https://brainworkshop.sourceforge.net/) by Jonathan Toomim.

The Dual N-Back task is based on research in cognitive psychology and working memory training.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Ensure you're using a modern, updated browser
3. Try the "How to Play" guide in the app

---

**Ready to train your brain?** Open `index.html` and start your first session!
