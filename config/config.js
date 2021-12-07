const config = {
  production: {
    SECRET: process.env.SECRET,
    DATABASE: process.env.MONGODB_URI,
  },
  default: {
    SECRET: 'mysecret',
    DATABASE: 'mongodb://localhost:27017/4dSight',
  },
};



exports.get = function get(env) {
  return config[env] || config.default;
};
