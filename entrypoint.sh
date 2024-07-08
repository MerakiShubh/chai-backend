#!/bin/sh

# Start Nginx
nginx

# Start PM2
pm2-runtime start ecosystem.config.cjs
