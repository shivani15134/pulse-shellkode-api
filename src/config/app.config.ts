const config = {
  frontendUrl: process.env.FRONTEND_URL || 'http://shivani.local.com:5173',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret',
  port: Number(process.env.PORT) || 3000,
};

export default config;