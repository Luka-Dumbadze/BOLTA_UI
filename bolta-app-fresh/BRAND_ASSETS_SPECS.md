# Boltha Brand Assets Specifications

## Brand Identity
- **App Name**: Boltha (corrected from "BOLTA")
- **Concept**: Step-based reward system combining fitness tracking with cryptocurrency-style rewards
- **Primary Color**: `#007AFF` (iOS Blue)
- **Accent Color**: `#FFD700` (Gold - for Bolt currency)
- **Background**: `#F2F2F7` (Light Gray)

## Asset Requirements

### 1. App Icon (1024x1024 PNG)

**Design Concept**: 
Combine a footprint/step symbol with a coin/reward element to represent the core app functionality.

**Specifications**:
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparent background
- **Style**: Minimalist, modern, iOS-style
- **Colors**: 
  - Primary: `#007AFF` (iOS Blue)
  - Accent: `#FFD700` (Gold)
  - Optional: White/light accents for depth

**Design Elements**:
1. **Main Symbol**: A stylized footprint or shoe sole outline
2. **Secondary Element**: A coin or circular reward badge overlapping or integrated
3. **Typography**: Clean, modern sans-serif for any text (minimal)
4. **Style**: Rounded corners, subtle gradients, iOS-compliant design

**Technical Requirements**:
- No transparency issues on dark/light backgrounds
- Scalable design that works at small sizes (16x16 to 1024x1024)
- Follows Apple Human Interface Guidelines
- High contrast and clear at all sizes

### 2. Splash Screen (1284x2778 pixels - iPhone 15 Pro Max)

**Design Concept**:
Clean, professional loading screen featuring the app icon centered on brand background.

**Specifications**:
- **Size**: 1284x2778 pixels (iPhone 15 Pro Max)
- **Format**: PNG
- **Background**: Solid color `#007AFF` (Primary Blue)
- **Layout**: 
  - App icon centered vertically and horizontally
  - Icon size: approximately 200x200 pixels on screen
  - Optional: "Boltha" wordmark below icon
  - Optional: Subtle loading indicator or animation guide

**Design Elements**:
1. **Background**: Solid `#007AFF` color fill
2. **Icon**: Centered app icon (white/gold version for contrast)
3. **Spacing**: Generous white space around icon
4. **Optional Text**: "Boltha" in clean, modern font

### 3. App Store Mockup (Phone Home Screen)

**Design Concept**:
Realistic iPhone home screen mockup showing Boltha icon among other popular apps.

**Specifications**:
- **Device**: iPhone 15 Pro or similar modern device
- **Screen Resolution**: 1290x2796 pixels
- **Format**: PNG or high-quality JPG
- **Context**: Home screen with multiple app icons

**Layout Requirements**:
1. **Boltha Icon**: Prominently placed (center or upper area)
2. **Surrounding Apps**: Popular, recognizable app icons (Instagram, WhatsApp, etc.)
3. **Background**: Realistic iOS wallpaper
4. **Lighting**: Professional product photography lighting
5. **Angle**: Slight 3D perspective or straight-on view

## File Structure

Create the following directory structure:

```
/assets/
├── app-icon/
│   ├── icon-1024.png          # Main app icon (1024x1024)
│   ├── icon-512.png           # Medium size (512x512)
│   ├── icon-256.png           # Small size (256x256)
│   └── adaptive-icon.png      # Android adaptive icon
├── splash/
│   ├── splash-1284x2778.png   # iPhone 15 Pro Max
│   ├── splash-1170x2532.png   # iPhone 15 Pro
│   └── splash-750x1334.png    # iPhone SE
├── marketing/
│   ├── app-store-mockup.png   # Phone home screen mockup
│   ├── icon-showcase.png      # Icon variations showcase
│   └── brand-guide.png        # Color and typography guide
└── source/
    ├── icon-source.ai         # Adobe Illustrator source
    ├── icon-source.sketch     # Sketch source
    └── icon-source.figma      # Figma link/file
```

## Color Palette Reference

```css
/* Primary Colors */
--primary-blue: #007AFF;
--bolt-gold: #FFD700;
--success-green: #34C759;

/* Neutral Colors */
--background-light: #F2F2F7;
--surface-white: #FFFFFF;
--text-primary: #000000;
--text-secondary: #8E8E93;
--border-light: #C6C6C8;

/* Gradient Options */
--primary-gradient: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
--gold-gradient: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
```

## Design Guidelines

### Icon Design Principles:
1. **Simplicity**: Clear, recognizable at small sizes
2. **Memorability**: Unique enough to stand out among other apps
3. **Relevance**: Clearly represents step-tracking and rewards
4. **Scalability**: Works from 16px to 1024px
5. **Platform Consistency**: Follows iOS/Android design guidelines

### Brand Personality:
- **Professional**: Clean, trustworthy design
- **Motivational**: Energetic, encouraging colors
- **Modern**: Contemporary design trends
- **Accessible**: High contrast, clear visibility

## Deliverables Checklist

- [ ] App icon (1024x1024 PNG, transparent background)
- [ ] App icon variations (512px, 256px)
- [ ] Android adaptive icon
- [ ] Splash screen (multiple iPhone sizes)
- [ ] App Store mockup (realistic phone context)
- [ ] Source files (AI/Sketch/Figma)
- [ ] Brand guide documentation

## Usage Rights
All assets should be created as original work with full commercial usage rights for the Boltha application and marketing materials.