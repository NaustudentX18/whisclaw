#!/bin/bash
export PATH="$HOME/.local/bin:$PATH"
MESSAGE="$1"

if [ -z "$MESSAGE" ]; then
  echo "Usage: whisclaw-ask.sh <message>"
  exit 1
fi

timeout 30 picoclaw agent -m "$MESSAGE" 2>&1 | grep -v "^🦞" | grep -v "^Hello" | head -5
