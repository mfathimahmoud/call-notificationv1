# Base image
FROM node:23.8.0
LABEL maintainer="Taylor Hanson <tahanson@cisco.com>"

# Set working directory
WORKDIR /workspace

# Copy dependency files and install only production deps
COPY package*.json ./
RUN npm install --production

# Copy app source
COPY . .
USER node
# Expose web app port + Azure SSH port (2222 for App Service)
EXPOSE 5000 2222

# Azure automatically handles SSH — don't start your own sshd.
# Just start the Node.js app.
#CMD ["npm", "start"]
CMD service ssh start && npm start
