const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Tidak ada token, akses ditolak.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak. Role tidak memiliki izin.' });
    }
    next();
  };
};

module.exports = { authorize };