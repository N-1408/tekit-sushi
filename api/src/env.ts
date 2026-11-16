// Central config. Every integration stays DISABLED until its flag is true and
// its credentials are present, so the app runs fully standalone on cash orders.
// Tokens are supplied by Nurmuhammad at VPS integration time.

const bool = (v?: string) => v === 'true';

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  botToken: process.env.BOT_TOKEN || '',
  webappUrl: process.env.WEBAPP_URL || '',
  rahmat: {
    enabled: bool(process.env.RAHMAT_ENABLED),
    appName: process.env.RAHMAT_APP_NAME || '',
    meshBaseUrl: process.env.RAHMAT_MESH_BASE_URL || 'https://mesh.multicard.uz',
    checkoutUrl: process.env.RAHMAT_CHECKOUT_URL || 'https://app.rhmt.uz',
    callbackSecret: process.env.RAHMAT_CALLBACK_SECRET || '',
  },
  iiko: {
    enabled: bool(process.env.IIKO_ENABLED),
    apiLogin: process.env.IIKO_API_LOGIN || '',
    organizationId: process.env.IIKO_ORGANIZATION_ID || '',
    terminalGroupId: process.env.IIKO_TERMINAL_GROUP_ID || '',
    baseUrl: process.env.IIKO_BASE_URL || 'https://api-ru.iiko.services',
  },
  taximaster: {
    enabled: bool(process.env.TAXIMASTER_ENABLED),
    apiUrl: process.env.TAXIMASTER_API_URL || '', // https://host:port, served by Millennium's TaxiMaster install
    apiKey: process.env.TAXIMASTER_API_KEY || '',
    crewGroupId: process.env.TAXIMASTER_CREW_GROUP_ID || '',
  },
  eskiz: {
    enabled: bool(process.env.ESKIZ_ENABLED),
    email: process.env.ESKIZ_EMAIL || '',
    password: process.env.ESKIZ_PASSWORD || '',
    sender: process.env.ESKIZ_SENDER || '', // approved sender name, assigned by Eskiz
    baseUrl: process.env.ESKIZ_BASE_URL || 'https://notify.eskiz.uz/api',
  },
};

export type Env = typeof env;
