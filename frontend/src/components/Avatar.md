# Avatar Component

## Overview
The Avatar component displays a 3D animated avatar that can switch between idle and talking states. It uses React Three Fiber and Three.js to render GLB models with smooth animations.

## Features
- Dynamic model switching between Idle.glb and Talking.glb
- Automatic animation playback with proper looping
- Auto-scaling and positioning for optimal display
- Error handling and loading states
- Development controls (OrbitControls in dev mode only)
- Customizable height prop

## Usage

```jsx
import Avatar from './components/Avatar';

// Basic usage
<Avatar isTalking={false} />

// With custom height
<Avatar isTalking={true} height="500px" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isTalking` | boolean | `false` | Controls which animation to play (Idle.glb vs Talking.glb) |
| `height` | string | `'100vh'` | CSS height value for the component container |

## Models Required
- `/public/models/Idle.glb` - Animation played when isTalking=false
- `/public/models/Talking.glb` - Animation played when isTalking=true

## Dependencies
- @react-three/fiber
- @react-three/drei
- three
- framer-motion (for parent components)

## Technical Notes
- Models are automatically scaled to fit the viewport
- Animations loop continuously using THREE.LoopRepeat
- Bounding box calculation ensures proper positioning
- OrbitControls are only enabled in development mode
- Component includes comprehensive error handling
