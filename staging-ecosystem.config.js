module.exports = {
  apps: [
    {
      name: 'staging-assist-server',
      script: './moduli/assist-server/server.js',
      cwd: '/opt/staging',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'staging',
        PORT: 4100,
        SUPABASE_URL: process.env.STAGING_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.STAGING_SUPABASE_SERVICE_KEY,
        ASSIST_PUBLIC_URL: 'https://staging-assist.rescuemanager.eu'
      },
      error_file: '/var/log/pm2/staging-assist-error.log',
      out_file: '/var/log/pm2/staging-assist-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'staging-rentri-api',
      script: './moduli/rentri-api/server.js',
      cwd: '/opt/staging',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'staging',
        PORT: 4003,
        SUPABASE_URL: process.env.STAGING_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.STAGING_SUPABASE_SERVICE_KEY
      },
      error_file: '/var/log/pm2/staging-rentri-api-error.log',
      out_file: '/var/log/pm2/staging-rentri-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'staging-sdi-sftp-server',
      script: './moduli/sdi-sftp-server/server.js',
      cwd: '/opt/staging',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'staging',
        PORT: 4005,
        SUPABASE_URL: process.env.STAGING_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.STAGING_SUPABASE_SERVICE_KEY,
        SDI_ID_NODO: '02166430856',
        SDI_ID_NODO_CF: 'SCZMNL05L21D960T'
      },
      error_file: '/var/log/pm2/staging-sdi-error.log',
      out_file: '/var/log/pm2/staging-sdi-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'staging-lead-api',
      script: './moduli/lead-api/server.js',
      cwd: '/opt/staging',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'staging',
        PORT: 4006,
        SUPABASE_URL: process.env.STAGING_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.STAGING_SUPABASE_SERVICE_KEY
      },
      error_file: '/var/log/pm2/staging-lead-api-error.log',
      out_file: '/var/log/pm2/staging-lead-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'staging-ebay-oauth',
      script: './moduli/ebay-oauth/server.js',
      cwd: '/opt/staging',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'staging',
        PORT: 4007,
        SUPABASE_URL: process.env.STAGING_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.STAGING_SUPABASE_SERVICE_KEY
      },
      error_file: '/var/log/pm2/staging-ebay-oauth-error.log',
      out_file: '/var/log/pm2/staging-ebay-oauth-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'staging-oauth-proxy-server',
      script: './moduli/oauth-proxy-server/server.js',
      cwd: '/opt/staging',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'staging',
        PORT: 4008
      },
      error_file: '/var/log/pm2/staging-oauth-proxy-error.log',
      out_file: '/var/log/pm2/staging-oauth-proxy-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'staging-rentri-polling',
      script: './moduli/rentri-polling/index.js',
      cwd: '/opt/staging',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'staging',
        SUPABASE_URL: process.env.STAGING_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.STAGING_SUPABASE_SERVICE_KEY
      },
      error_file: '/var/log/pm2/staging-rentri-polling-error.log',
      out_file: '/var/log/pm2/staging-rentri-polling-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'staging-rentri-server',
      script: './moduli/rentri-server/server.js',
      cwd: '/opt/staging',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'staging',
        PORT: 4200
      },
      error_file: '/var/log/pm2/staging-rentri-server-error.log',
      out_file: '/var/log/pm2/staging-rentri-server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'staging-rvfu-proxy-direct',
      script: './moduli/rvfu-proxy-direct/server.js',
      cwd: '/opt/staging',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'staging',
        PORT: 4009
      },
      error_file: '/var/log/pm2/staging-rvfu-proxy-error.log',
      out_file: '/var/log/pm2/staging-rvfu-proxy-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
