# Vibex Chrome Extension v2.0

## Data Collector & AI Writing Assistant for X (Twitter)

This extension allows you to collect your posts and likes directly from X without using the API, and provides an AI-powered writing assistant.

## Features

### Data Collection (No API Required)
- **Collect Your Posts**: Automatically scroll and collect all your tweets from your profile
- **Collect Your Likes**: Collect all posts you've liked
- **Export to JSON**: Download your collected data for backup or analysis
- **Local Storage**: All data is stored locally in your browser

### AI Writing Assistant
- **Generate Posts**: Create tweets based on topics you provide
- **Multiple Tones**: Professional, Casual, Humorous, Inspirational, Controversial
- **Multiple Styles**: Single tweet, Thread, Hook + Value, Storytelling
- **Match Your Style**: Use your collected posts to match your writing style

### Keyboard Shortcuts
- `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Windows): Collect posts
- `Cmd+Shift+W` (Mac) / `Ctrl+Shift+W` (Windows): Open AI Writer

## Installation

### Development Mode

1. **Build the extension**:
   ```bash
   cd extension
   npm install
   npm run build
   ```

2. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `extension/dist` folder

### From Source (Watch Mode)

```bash
cd extension
npm run watch
```

This will automatically rebuild when you make changes.

## Usage

### Collecting Posts

1. Navigate to your X profile (x.com/yourusername)
2. Click the Vibex floating button (bottom right) or use the popup
3. Click "Collect Posts"
4. The extension will automatically scroll and collect all visible posts
5. Data is saved locally and can be exported

### Collecting Likes

1. Navigate to your likes page (x.com/yourusername/likes)
2. Click "Collect Likes"
3. The extension will scroll and collect all liked posts

### Using the AI Writer

1. Click the Vibex button and select "AI Writer"
2. Enter a topic you want to write about
3. Select tone and style
4. Optionally check "Match my writing style" to use your collected posts
5. Click "Generate Post"
6. Copy or insert the generated text

## Data Storage

All collected data is stored locally in Chrome's storage:
- `vibex_posts`: Your collected posts
- `vibex_likes`: Your collected likes
- Timestamps for last collection

## Privacy

- **No data is sent to external servers** unless you explicitly sync to the Vibex backend
- All scraping happens locally in your browser
- You control your data completely

## Technical Details

### Manifest V3
This extension uses Chrome's Manifest V3 for better security and performance.

### Permissions
- `storage`: Store collected data locally
- `activeTab`: Access the current tab for scraping
- `scripting`: Inject content scripts
- `contextMenus`: Right-click menu options
- `notifications`: Show collection complete notifications

### Host Permissions
- `https://twitter.com/*`
- `https://x.com/*`
- `http://localhost:5000/*` (for backend sync)

## Development

### Project Structure
```
extension/
  src/
    background.js   # Service worker
    content.js      # Content script (runs on X pages)
    content.css     # Styles for injected UI
    popup.js        # Popup script
  icons/            # Extension icons
  manifest.json     # Extension manifest
  popup.html        # Popup UI
  webpack.config.js # Build configuration
```

### Building
```bash
npm run build      # Production build
npm run watch      # Development with auto-rebuild
```

## Troubleshooting

### Extension not working on X
- Make sure you're on twitter.com or x.com
- Refresh the page after installing
- Check that the extension is enabled in chrome://extensions

### Collection stops early
- X may rate-limit scrolling; wait a moment and try again
- Some posts may be hidden or unavailable

### AI Writer not generating
- Check if you're connected to the backend (localhost:5000)
- The extension includes fallback templates if the backend is unavailable

## License

MIT License - See main project LICENSE file
