# Hero photo: how to generate and add it

The hero's right side is a photo slot. Today it shows a navy-to-green gradient with a real screenshot of the FinPath dashboard on top, plus two live cards (the score and "$214/mo leaking"). The photo goes **behind** the screenshot, so the dashboard stays real and only the setting changes.

## What the photo needs

- **Size:** landscape, at least 2000 × 1700 px (ratio about 4:3.4). Export as JPG, quality 80, under 400 KB.
- **Layout:** the dashboard screenshot covers the right two-thirds and the bottom half. Keep the interesting part of the photo in the **top-left corner and the left edge**. The right and bottom areas should stay calm and dark (out of focus is fine).
- **Light:** soft, warm morning light from the left. Medium-dark overall, so the white screenshot and cards stand out.
- **No:** text, logos, brand names, readable screens, faces looking at the camera, or hands holding a phone with a visible app.

## Prompt (copy this into Midjourney, GPT Image, Flux or Higgsfield)

> Editorial photograph of a small online seller's workbench in a sunlit home studio, early morning. On the left side of the frame: hand-poured soy candles in amber glass jars, a roll of kraft paper, shipping boxes stacked neatly, a ceramic mug of coffee, a green trailing plant catching the light. The right half of the frame falls into a soft, dark, out-of-focus wall in deep navy and forest green tones. Shallow depth of field, 35 mm lens, f/2.0, warm window light from the left, gentle shadows, calm and organised mood, muted natural colours with deep navy and green accents. No people, no text, no logos, no screens. Landscape, 4:3.

**Negative prompt** (if your tool has one): `text, letters, watermark, logo, brand, screen, monitor, laptop, phone, person, face, hands, clutter, oversaturated, HDR`

### Two alternatives

- **Market stall:** "A craft-market stall at golden hour, wooden table with handmade candles and soaps on the left, string lights blurred in the background, right side dark and out of focus, navy and green tones, shallow depth of field, no people, no text, landscape 4:3."
- **Packing table:** "Overhead three-quarter view of a packing table: kraft mailer boxes, tissue paper, a tape dispenser and a few small products on the left third, the rest a dark navy linen surface with soft falloff, warm window light, no text, no people, landscape 4:3."

## How to add it

1. Save the file as `public/landing/hero-photo.jpg`.
2. In `public/landing/landing.css`, find `.fp-h__media { --photo: none;` and change it to:

   ```css
   .fp-h__media { --photo: url(/landing/hero-photo.jpg);
   ```

3. Reload the page. The gradient stays underneath as a fallback.

If the photo is too bright behind the screenshot, add a dark layer by changing the same line to:

```css
.fp-h__media { --photo: linear-gradient(90deg, rgb(8 16 31 / 0) 0%, rgb(8 16 31 / .55) 70%), url(/landing/hero-photo.jpg);
```

## Refreshing the dashboard screenshot

The inset is `public/landing/hero-app.jpg`, taken from the live demo at 1440 × 900 (2× scale). Retake it whenever the Overview page changes, so the landing never shows an older version of the app.
