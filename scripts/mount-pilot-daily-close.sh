#!/bin/sh

set -eu

IMAGE="${PILOT_DAILY_CLOSE_IMAGE:-$HOME/.local/share/barber-queue-pilot/daily-close-r1.sparsebundle}"
SERVICE="${PILOT_DAILY_CLOSE_KEYCHAIN_SERVICE:-barber-queue-pilot-daily-close-r1}"
ACCOUNT="${PILOT_DAILY_CLOSE_KEYCHAIN_ACCOUNT:-$(id -un)}"
MOUNT_POINT="/Volumes/Barber Pilot Evidence"

if [ -d "$MOUNT_POINT" ]; then
  echo "Daily Close container is already mounted: $MOUNT_POINT"
  exit 0
fi

if [ ! -d "$IMAGE" ]; then
  echo "Daily Close container not found: $IMAGE" >&2
  exit 1
fi

PASSWORD="$(security find-generic-password -a "$ACCOUNT" -s "$SERVICE" -w)"
printf '%s' "$PASSWORD" | hdiutil attach -stdinpass -nobrowse "$IMAGE" >/dev/null
unset PASSWORD

if [ ! -d "$MOUNT_POINT" ]; then
  echo "Daily Close mount failed." >&2
  exit 1
fi

echo "Daily Close container mounted: $MOUNT_POINT"
echo "Keep it mounted only while validating or reconciling, then run scripts/unmount-pilot-daily-close.sh."
