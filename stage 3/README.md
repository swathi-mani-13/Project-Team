# Stage 3 — Laptop Face Recognition Demo

This standalone browser demo registers a face descriptor locally and matches it from the laptop webcam. It uses `face-api.js`, browser LocalStorage, and no backend.

## Run it

1. Open the `stage3-face-recognition` folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html`, then select **Open with Live Server**.
4. Allow camera access in the browser.
5. Enter a student name and ID, then click **Capture & Register Face**.

Do not open `index.html` directly from the file system: camera access requires `localhost` or HTTPS.

## Notes

- Face-api model files load from the public face-api.js model CDN; internet is needed on first load.
- All saved profiles remain only in the current browser under LocalStorage. **Clear demo data** removes them.
- The confidence value is a demo-friendly conversion of face-descriptor distance. It is not an anti-spoofing or production-security system.
- Obtain informed consent and protect biometric data before any real deployment.
