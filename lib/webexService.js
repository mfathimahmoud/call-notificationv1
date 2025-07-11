import fetch from "node-fetch";
import path from "path";
import Cache from 'ttl-mem-cache';
import { config } from './config.js';

const cache = new Cache();

export async function getPerson(token) {
  try {
    const response = await fetch('https://webexapis.com/v1/people/me', {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const person = await response.json();
    console.log('getPerson response status:', response.status);
    
    if (response.status === 429) {
      person.retry = response.headers.get('Retry-After');
    }
    
    return person;
  } catch (error) {
    console.error('Error getting person:', error);
    throw error;
  }
}

export async function isUserAdmin(accessToken) {
  let isAdmin = cache.get(accessToken + "-admin");
  
  if (isAdmin === null) {
    try {
      let url = 'https://webexapis.com/v1/licenses';
      if (config.webex.orgId) {
        url += `?orgId=${config.webex.orgId}`;
      }
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log('GET Admin licenses status:', response.status);
      
      if (response.status >= 200 && response.status <= 204) {
        isAdmin = "true";
        cache.set(accessToken + "-admin", isAdmin, 3600 * 8 * 1000);
      } else {
        isAdmin = "false";
        cache.set(accessToken + "-admin", isAdmin, 1800 * 1000);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      isAdmin = "false";
      cache.set(accessToken + "-admin", isAdmin, 1800 * 1000);
    }
  }
  
  return isAdmin;
}

export async function getAccessToken(code) {
  try {
    const payload = new URLSearchParams({
      client_id: config.webex.clientId,
      client_secret: config.webex.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: `${config.webex.baseUri}/oauth`
    });
    
    const response = await fetch('https://webexapis.com/v1/access_token', {
      method: "POST",
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload
    });
    
    const json = await response.json();
    console.log('/access_token response json:', json);
    
    return json;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
}

export async function ensureWebhook(token) {
  try {
    console.log('ensuring webhooks');
    
    // Get existing webhooks
    const response = await fetch('https://webexapis.com/v1/webhooks', {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const webhooks = await response.json();
    console.log('webhooks count:', webhooks.items.length);
    
    let exists = false;
    
    // Check and clean up existing webhooks
    for (const webhook of webhooks.items) {
      if (webhook.targetUrl.indexOf(config.webex.baseUri) >= 0 && 
          webhook.resource === "telephony_calls") {
        if (webhook.name === config.webex.webhookTitle) {
          exists = true;
          break;
        } else {
          console.log('deleting webhook:', webhook);
          await fetch(`https://webexapis.com/v1/webhooks/${webhook.id}`, {
            method: "DELETE",
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        }
      }
    }
    
    // Create new webhook if it doesn't exist
    if (!exists) {
      const url = new URL(config.webex.baseUri);
      url.pathname = path.join(url.pathname, 'agent_webhook');
      
      const payload = {
        name: config.webex.webhookTitle,
        targetUrl: url.href,
        resource: 'telephony_calls',
        event: 'created'
      };
      
      const postResponse = await fetch('https://webexapis.com/v1/webhooks', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const created = await postResponse.json();
      console.log('webhook created response:', created);
    } else {
      console.log("Webhook already exists for agent.");
    }
  } catch (error) {
    console.error('ensureWebhook error:', error);
  }
}

export function getAuthorizationUrl(state) {
  const params = new URLSearchParams({
    client_id: config.webex.clientId,
    response_type: 'code',
    redirect_uri: `${config.webex.baseUri}/oauth`,
    scope: config.webex.scopes,
    state: state
  });
  
  return `https://webexapis.com/v1/authorize?${params.toString()}`;
}

export function getCachedPersonId(token) {
  return cache.get(token);
}

export function setCachedPersonId(token, personId) {
  cache.set(token, personId, 3600 * 1000);
}