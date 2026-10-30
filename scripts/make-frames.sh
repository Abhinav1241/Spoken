#!/usr/bin/env bash
# Rebuilds the scroll-film frames the homepage plays (public/home/f48b/f_000.webp ... f_524.webp)
# from the hero render in assets/hero.mp4: 1600x900, motion-interpolated from 24 to 48 fps.
# Needs ffmpeg with libwebp.  Usage: ./scripts/make-frames.sh
set -euo pipefail
cd "$(dirname "$0")/.."
out=public/home/f48b
mkdir -p "$out"
ffmpeg -y -v error -i assets/hero.mp4 \
  -vf "scale=1600:900,minterpolate=fps=48:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
  -frames:v 525 -start_number 0 -c:v libwebp -quality 80 "$out/f_%03d.webp"
echo "wrote $(ls "$out" | wc -l) frames to $out"
