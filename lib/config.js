import 'dotenv/config';

export const config = {
  port: process.env.MY_APP_PORT || 5000,
  mongodb: {
    uri: process.env.MONGODB_SRV,
    database: process.env.MONGODB,
    collections: {
      queue: process.env.QUEUE_COL,
      user: process.env.USER_COL
    }
  },
  webex: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    baseUri: process.env.BASE_URI,
    scopes: process.env.SCOPES,
    orgId: process.env.ORG_ID,
    webhookTitle: process.env.WEBHOOK_TITLE
  },
  mercuryMode: process.env.MERCURY_MODE?.toLowerCase() === "true",
  cookie: {
    maxAgeDays: 7,
    options: { 
      maxAge: 86400 * 1000 * 7, 
      secure: true, 
      sameSite: "lax" 
    }
  }
};

export const isMercuryMode = () => config.mercuryMode;