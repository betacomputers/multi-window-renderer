# Multi-Window Rendering Framework

This project uses `Three.js` to render customizable 3D scenes across multiple synchronized browser windows.

### Features:

- **Window Management**: Tracks and syncs window size, position, and metadata via `localStorage`.
- **Dynamic 3D Rendering**: Renders and updates geometries based on window properties using `Three.js`.
- **Real-Time Sync**: Smoothly updates scene when window position or size changes.
- **Custom Metadata**: Add metadata to each window for customization.
- **Customizable Render Objects**: Easily change the rendered geometries (e.g., switch between shapes like `BoxGeometry` or `IcosahedronGeometry`).

### Requirements:

- Requires `Three.js` and browser support for `localStorage`.
- Syncs windows via event listeners for `beforeunload` and `storage`.
