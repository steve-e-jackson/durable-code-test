# Racing Game Audio Files

## Required Audio Files

Download these free, royalty-free audio files and place them in this directory:

### Engine Sounds
1. **engine-idle.mp3** - Low RPM engine idle sound
   - Source: https://pixabay.com/sound-effects/search/car-engine/
   - Search: "car engine idle"
   - Duration: 2-5 seconds (loopable)

2. **engine-rev.mp3** - Engine revving/acceleration
   - Source: https://pixabay.com/sound-effects/search/race-car/
   - Search: "race car engine rev"
   - Duration: 3-8 seconds

3. **engine-high.mp3** - High RPM sustained sound
   - Source: https://mixkit.co/free-sound-effects/race-car/
   - Search: "race car high speed"
   - Duration: 3-10 seconds (loopable)

### Effect Sounds
4. **tire-screech.mp3** - Tire skidding/drifting sound
   - Source: https://pixabay.com/sound-effects/search/tire-screech/
   - Search: "tire screech" or "drift"
   - Duration: 1-3 seconds

5. **collision.mp3** - Crash/impact sound
   - Source: https://www.zapsplat.com/sound-effect-category/motor-racing/
   - Search: "car crash" or "collision"
   - Duration: 0.5-2 seconds

6. **gear-shift.mp3** - Optional gear change sound
   - Source: https://pixabay.com/sound-effects/search/gear-shift/
   - Search: "gear shift" or "transmission"
   - Duration: 0.3-1 second

### Ambient Sounds (Optional)
7. **crowd-ambient.mp3** - Background crowd noise
   - Source: https://freesound.org/
   - Search: "racing crowd" or "stadium ambience"
   - Duration: 30+ seconds (loopable)

## Licensing Information

All sources listed provide royalty-free audio under:
- **Pixabay**: Pixabay License (free for commercial use, no attribution required)
- **Mixkit**: Free for commercial use
- **ZapSplat**: Free with attribution (check specific license)
- **Freesound**: Various Creative Commons licenses (check individual files)

## File Format Requirements

- Format: MP3 (preferred) or OGG/WAV
- Sample Rate: 44.1kHz or 48kHz
- Bit Rate: 128kbps minimum (192kbps recommended)
- Channels: Mono or Stereo

## Notes

The game will gracefully fallback to synthesized audio if these files are not present. However, real audio files provide a much more immersive racing experience.

## Alternative: Use Synthesized Audio

If you prefer not to download audio files, the current SoundManager already generates synthetic audio using Web Audio API oscillators. This PR enhances the audio system to support both real and synthesized audio.