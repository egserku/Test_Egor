#!/bin/bash
echo "Syncing project with GitHub..."
git add .
git commit -m "backup $(date)"
git push
echo "Sync complete!"
