############################################################
# Dockerfile to build Call Notifications Sidebar App
############################################################
#docker build -t call-notifications-sidebar .
#docker run --init -i -p 10031:10031 -t call-notifications-sidebar
#docker save call-notifications-sidebar  -o call-notifications-sidebar.tar
###########################################################################

FROM node:23.8.0

# File Author / Maintainer
MAINTAINER "Taylor Hanson <tahanson@cisco.com>"

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
#COPY prod.env .env
ENV PORT=8080
EXPOSE 8080
CMD [ "npm", "start" ]
