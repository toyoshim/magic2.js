# magic2.js
MAGIC2 compatible library in JavaScript

# Restrictions
- Some commands throw unsupported errors just because SION2 does not use them
  - SPLINE
  - BOX
  - TRIANGLE
  - CIRCLE_FULL
  - POINT

- Some commands are ignored or partially ignored
  - SET_MODE: always aka ADD operation is applied
  - CLS: window rect is not used correctly
  - CRT: mode 3 (256x256 16-colors) is always applied

# Extended stereo graphic features

## Split mode
Split a screen into two screens for left and right eyes.

## Color mode
Draws in red and blue into a overlayed screen for left and right eyes.