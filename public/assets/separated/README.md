# Separated FPS city assets

Generated from `dense_tightly_packed_city.glb` using the actual GLB scene graph. Each source node is exported to its own GLB and its original transform is baked into the vertices, preserving the object's exact world placement when loaded at identity transform.

Categories: buildings, containers, doors, ground, other. The manifest contains stable IDs, original node names, paths, and bounds.

Important: do not replace a GLB with a centered-origin model without updating its geometry/origin convention; this pack preserves placement by baking original city coordinates into each mesh. For easier future swaps, keep each replacement's vertices in the same city coordinate space or update the manifest transform. The original combined GLB remains the production fallback.
