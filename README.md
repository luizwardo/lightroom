# Interactive 2.5D Bedroom Scene

This project creates an interactive 2.5D bedroom scene using Three.js and WebGL, with lighting controls.

## Setup Instructions

1. Open the project in VS Code.
2. Open `index.html` in a web browser to view the scene.
3. Use the controls below the scene to toggle lights on/off and adjust intensity.

## Blender Modeling (Optional)

To replace the simple geometries with detailed models:

1. Open Blender and create a new scene.
2. Model the bedroom components:
   - Room: Floor, walls, ceiling
   - Bed: King-size bed
   - Tables: Two bedside tables
   - Lamps: Two lamps on tables
   - Picture: Framed picture on wall
3. Export each model as GLTF (.gltf or .glb) to the `models/` folder.
4. Update the GLTF loader code in `js/main.js` to load your models instead of the basic geometries.

## Features

- 2.5D perspective view
- Interactive lighting controls
- Real-time shadows
- Ambient, spotlight, and directional lighting

## Technologies Used

- Three.js for 3D rendering
- WebGL for graphics processing
- HTML/CSS for UI# roomlight
# lightroom
