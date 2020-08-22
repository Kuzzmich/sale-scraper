#!/bin/bash
echo "Starting redis-server..."
redis-server --daemonize yes

"$@"
