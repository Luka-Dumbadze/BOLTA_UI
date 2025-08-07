# Boltha Assets Directory

This directory contains all brand assets for the Boltha application.

## Directory Structure

```
/assets/
├── app-icon/           # App icons in various sizes
├── splash/             # Splash screen images
├── marketing/          # Marketing and promotional assets
└── source/             # Source design files
```

## Required Assets

### App Icons
- `icon-1024.png` - Main app icon (1024x1024)
- `icon-512.png` - Medium size (512x512)
- `icon-256.png` - Small size (256x256)
- `adaptive-icon.png` - Android adaptive icon

### Splash Screens
- `splash-1284x2778.png` - iPhone 15 Pro Max
- `splash-1170x2532.png` - iPhone 15 Pro
- `splash-750x1334.png` - iPhone SE

### Marketing Assets
- `app-store-mockup.png` - Phone home screen mockup
- `icon-showcase.png` - Icon variations showcase
- `brand-guide.png` - Color and typography guide

## Design Specifications

See `BRAND_ASSETS_SPECS.md` in the project root for detailed design specifications, color palettes, and technical requirements.

## Current Status

🚧 **Assets Needed**: The following assets need to be created by a designer:

- [ ] App icon (1024x1024 PNG)
- [ ] App icon variations (512px, 256px)
- [ ] Android adaptive icon
- [ ] Splash screens (multiple sizes)
- [ ] App Store mockup
- [ ] Source design files

## Usage

Once assets are created and placed in the correct directories, run:

```bash
npx expo start --clear
```

This will refresh the app with the new assets.