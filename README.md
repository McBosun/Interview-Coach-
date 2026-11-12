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

## Your API key
Open the page, paste your Anthropic API key in the box, and start. The key stays in your browser only. Don't share a page with your key saved in it, and prefer a key with a spend limit.

Voice input uses your browser's speech recognition (Chrome and Edge work best). If it isn't available, record or type your answer.
