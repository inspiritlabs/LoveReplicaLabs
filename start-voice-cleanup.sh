#!/bin/bash
# Start voice cleanup service that runs every 5 minutes

while true; do
    echo "$(date): Running voice cleanup..."
    node delete-voices.js
    echo "$(date): Voice cleanup completed, sleeping for 5 minutes..."
    sleep 300
done