# Set the base image to Ubuntu
FROM    ubuntu:trusty
# File Author / Maintainer
MAINTAINER Shaun Morrow
# Install Node.js and other dependencies
RUN apt-get update && \
    apt-get -y install curl && \
    curl -sL https://deb.nodesource.com/setup_4.x | sudo bash - && \
    apt-get -y install python build-essential nodejs
# Install nodemon
RUN npm install -g nodemon
# Provides cached layer for node_modules
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN mkdir -p /src && cp -a /tmp/node_modules /src/
# Define working directory
WORKDIR /src
ADD . /src
ADD crontab /etc/cron.d/bot-cron

RUN touch /var/log/cron.log
RUN chmod +x /etc/cron.d/bot-cron
RUN chmod +x /src/bot.sh
RUN /usr/bin/crontab /etc/cron.d/bot-cron

# Run app using nodemon
CMD /bin/sh /src/bot.sh
ENV COOKIE_SECRET "MAKE THIS A LONG, RANDOM STRING"
ENV BOT_API_KEY "YOUR KEY TO LOGON TO THE BOT"
ENV STEEM_USER "YOUR STEEM USER NAME"
ENV POSTING_KEY_PRV "YOUR PRIVATE POSTING KEY"
ENV REDIS_URL="redis://redis:6379"
