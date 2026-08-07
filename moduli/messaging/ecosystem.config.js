// PM2 config per il messaging-server.
// Prod: il servizio gira in /opt/messaging-server e legge /root/.env (dotenv path
// esplicito nel server.js), quindi non serve passare le env qui.
// Avvio prod manuale equivalente:
//   pm2 start /opt/messaging-server/server.js --name messaging-server
// Staging: porta 4120 (vedi cwd /opt/staging se servisse).

module.exports = {
  apps: [
    {
      name: 'messaging-server',
      script: 'server.js',
      cwd: '/opt/messaging-server',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', MESSAGING_PORT: 3120 },
    },
  ],
};
