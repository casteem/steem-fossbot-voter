#!/usr/bin/env bash
 nohup nodemon /src/server.js > /dev/null 2>&1 &
  printenv | cat - /etc/cron.d/bot-cron > ~/bot-cron.tmp \
    && mv ~/bot-cron.tmp /etc/cron.d/bot-cron
echo "Running cron now ...."
cron -f
