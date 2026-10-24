// Free open access — no authentication barriers or required JWT tokens
const authMiddleware = (req, res, next) => {
  req.user = {
    id: req.header('x-user-id') || 'free_developer',
    name: req.header('x-user-name') || 'Developer',
    role: 'developer'
  };
  next();
};

const optionalAuthMiddleware = (req, res, next) => {
  req.user = {
    id: req.header('x-user-id') || 'free_developer',
    name: req.header('x-user-name') || 'Developer',
    role: 'developer'
  };
  next();
};

const adminMiddleware = (req, res, next) => {
  req.user = {
    id: 'admin_user',
    name: 'Administrator',
    role: 'admin'
  };
  next();
};

module.exports = { authMiddleware, adminMiddleware, optionalAuthMiddleware };
