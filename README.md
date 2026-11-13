# Hospitality Manager Interview Coach

A mock-interview app: the interviewer speaks each question, gives feedback on your spoken or typed answers, and ends with a scorecard.

## Files
- `index.html` – page structure
- `style.css` – responsive styles (phone to desktop, light/dark)
- `app.js` – interview logic, text-to-speech, recording and transcription
- `standalone.js` – lets the app call the Anthropic API directly with your own key

## Put it online with GitHub Pages
1. Create a new GitHub repository and upload these four files (plus this README).
2. Repository **Settings → Pages → Build and deployment**: source **Deploy from a branch**, branch **main**, folder **/ (root)**, then Save.
3. After a minute your link is `https://<your-username>.github.io/<repo-name>/`.

## No API key needed
The app works out of the box with a built-in interviewer: a bank of hospitality manager questions for each role, instant feedback on every answer, and a scorecard. It scores with simple rules (structure, guest focus, leadership, numbers), not AI.

**Optional:** paste an Anthropic API key on the first screen for a smarter AI interviewer. The key stays in your browser only. If the key is rejected (error 401) or unreachable, the app clears it and falls back to the built-in interviewer automatically.

Voice: the interviewer reads questions aloud. Voice answers use your browser's speech recognition (Chrome and Edge work best); you can also record or type.

If your browser can't transcribe speech, the app converts your recording to text on your own device using a small speech model (about 40 MB, downloaded once, English only), then sends it.
