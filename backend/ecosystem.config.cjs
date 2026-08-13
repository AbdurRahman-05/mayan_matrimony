module.exports = {
  apps: [
    {
      name: 'matrimony-backend',
      script: './server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      max_memory_restart: '1G',
      exp_backoff_restart_delay: 100
    }
  ]
};
