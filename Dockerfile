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

# Install SSH
RUN apt-get update && apt-get install -y openssh-server

# Create SSH directory
RUN mkdir /var/run/sshd

# Set root password (for SSH)
RUN echo 'root:Docker!' | chpasswd

# Configure SSH to run on port 2222 (Azure requirement)
RUN sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 10031 2222 5000
CMD service ssh start && npm start
