# India Flood Watch

Build a responsive web application called India Flood Intelligence.

This is a hackathon prototype for an AI/ML-based integrated heavy-rainfall early-warning and inundation-prediction system.

Important scope:

- Build a website/PWA, not a native mobile app.

- Focus on India, not only Mumbai.

- The application must be mobile-friendly and desktop-friendly.

- Do not claim that the system is an official government warning service.

- Do not fabricate live satellite or radar data.

- Use a clearly labelled Demo Mode for simulated data.

- Keep the code modular so live satellite, radar, weather-station, and NWP APIs can be added later.

Create these main sections:

1. National India map dashboard.

2. Forecast and flood-risk summary cards.

3. Selected-location details panel.

4. Rainfall forecast timeline.

5. Predicted inundation layer.

6. Data-source and data-quality panel.

7. Citizen flood-report form.

8. Recent flood reports feed.

9. Explainable “Why this risk?” panel.

10. Demo Mode controls.

Use:

- React or Next.js with TypeScript.

- Tailwind CSS.

- Leaflet or another map library that does not require a paid API key.

- Reusable components.

- Mock data initially.

- Clean, professional disaster-management dashboard design.

- Dark navy, white, amber, red, and blue visual theme.

- Clear loading, error, empty, and offline states.

Add these demonstration locations:

- Mumbai, Maharashtra

- Ahmedabad, Gujarat

- Chennai, Tamil Nadu

- Guwahati, Assam

- Patna, Bihar

- Kochi, Kerala

- Bengaluru, Karnataka

- Kolkata, West Bengal

- Delhi, Delhi

- Srinagar, Jammu and Kashmir

Every risk prediction must show:

- Risk level

- Risk score

- Rainfall forecast

- Estimated water depth

- Expected onset time

- Confidence

- Last updated time

- Data sources used

Add a disclaimer:

“This is a research prototype and not an official emergency warning system. Verify alerts with official authorities.”

First create only the UI and mock data. Do not integrate APIs or authentication yet. keep the background interesting dont keep it plane add a search place bar to the map so that user  can search the place and keep the ui good and interesting like really nice and impressive

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7493b9fe-9da0-4bae-8610-e30c6234b795).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
