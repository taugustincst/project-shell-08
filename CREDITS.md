# Credits and data sources

- Country outlines: hand-authored, deliberately simplified polygons (`js/world.js`), drawn for recognition rather than precision. They are not derived from any external dataset and should not be used as geographic reference.
- Facts (languages, scripts, currencies, railway gauges, driving side, coasts, neighbours, flags, native wildlife): compiled from general reference knowledge. Only facts the authors were confident of were included; where a fact was uncertain (for example a railway gauge), the field was left out and the game never asks about it. Corrections are welcome and go in `js/world.js`.
- Sun-angle clues use the solar declination at the solstices and equinox (±23.4°, 0°) and each land's rough central latitude.
- Fonts: system serif. Icons: drawn in `tools/make-icons.js`.
