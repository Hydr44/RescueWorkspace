module.exports = {
  apps: [{
    name: 'lead-api',
    script: 'server.js',
    cwd: '/opt/lead-api',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production',
      LEAD_API_PORT: 3006
    }
  }]
};
