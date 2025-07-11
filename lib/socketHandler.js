import { getPerson, ensureWebhook, getCachedPersonId, setCachedPersonId } from './webexService.js';
import { isMercuryMode } from './config.js';

export function setupSocketHandlers(io) {
  io.on('connection', async (socket) => {
    console.log('a user connected:', socket.id);
    console.log(socket.handshake);
    
    let authorized = false;
    
    // Check authorization
    if (socket.handshake.auth.token) {
      if (socket.handshake.headers.cookie) {
        if (socket.handshake.headers.cookie.indexOf(socket.handshake.auth.token) >= 0) {
          authorized = true;
        }
      }
    }
    
    console.log('socket authorized:', authorized);
    
    if (authorized) {
      try {
        let personId = getCachedPersonId(socket.handshake.auth.token);
        
        if (!personId) {
          console.log("token not in cache, looking up person...");
          const person = await getPerson(socket.handshake.auth.token);
          
          if (person && person.id) {
            personId = person.id;
            console.log("person:", person);
            
            if (!isMercuryMode()) {
              await ensureWebhook(socket.handshake.auth.token);
            }
            
            setCachedPersonId(socket.handshake.auth.token, personId);
          } else {
            console.log('invalid person returned:', person);
            socket.disconnect();
            return;
          }
        }
        
        if (personId) {
          console.log('joining room', personId);
          socket.join(personId);
        }
      } catch (error) {
        console.error('Socket authorization error:', error);
        socket.disconnect();
      }
    } else {
      socket.disconnect();
    }
    
    // Handle socket events
    socket.on('disconnect', () => {
      console.log('user disconnected:', socket.id);
    });
    
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
}