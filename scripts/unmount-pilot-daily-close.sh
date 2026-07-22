#!/bin/sh

set -eu

MOUNT_POINT="/Volumes/Barber Pilot Evidence"

if [ ! -d "$MOUNT_POINT" ]; then
  echo "Daily Close container is not mounted."
  exit 0
fi

sync
hdiutil detach "$MOUNT_POINT" >/dev/null
echo "Daily Close container unmounted."
