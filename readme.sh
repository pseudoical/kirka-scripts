#!/bin/bash

set -euo pipefail

# Generate WebP files
for f in ./assets/*.mp4; do
    out="./assets/$(basename "${f%.mp4}.webp")"
    [ -f "$out" ] || ffmpeg -i "$f" -c:v libwebp -vf fps=30 -loop 0 "$out" &
done

wait

# Generate README file
OUTPUT="README.md"

cat > "$OUTPUT" <<EOF
# Kirka Scripts

A collection of unofficial [Kirka.io](https://kirka.io/) scripts designed to enhance and customize gameplay.

If a script doesn't work, refresh the page and try again. For more help, message [@pseudoical](https://discord.com/users/1408292932624060426) on Discord.

EOF

{
    for script in ./scripts/*.js; do
        content=$(<"$script")

        for field in name version description; do
            # Capture `Hello World` from `@name Hello World\n`
            [[ $content =~ @$field[[:space:]]+([^$'\n']+) ]] \
                && declare "$field=${BASH_REMATCH[1]}"
        done

        script="${script#./}"
        asset="assets/$(basename "$script")"
        asset=("${asset%.js}".webp)
        asset="${asset[0]}"

        printf \
            "# [%s](%s) v%s\n\n%s\n\n![%s](%s)\n\n" \
            "$name" "$script" "$version" "$description" "$name" "$asset"
    done
} >> "$OUTPUT"

cat >> "$OUTPUT" <<EOF
---

<p align="center">This project is licensed under the <a href="LICENSE">MIT License</a>.</p>
EOF
