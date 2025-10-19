############################################################
# Dockerfile to build Call Notifications Sidebar App
############################################################
# docker build -t call-notifications-sidebar .
# docker run --init -i -p 10031:10031 -t call-notifications-sidebar
# docker save call-notifications-sidebar -o call-notifications-sidebar.tar
#############################################################

FROM node:23.8.0
LABEL maintainer="Taylor Hanson <tahanson@cisco.com>"

# Install SSH
RUN apt-get update && apt-get install -y openssh-server && \
    mkdir /var/run/sshd && \
    echo 'root:Docker!' | chpasswd && \
    sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Copy app files
COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000 2222

#CMD ["bash", "-c", "service ssh start && npm start"]
CMD ["bash", "-c", "/usr/sbin/sshd -D & exec npm start"]

