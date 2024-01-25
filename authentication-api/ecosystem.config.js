module.exports = {
  apps: [
    {
      name: 'AUTH_API',
      script: './app.js',
      instances: '1',
      exec_mode: 'fork'
    },
  ],
};
