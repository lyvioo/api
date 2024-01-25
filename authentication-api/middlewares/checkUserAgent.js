module.exports = (req, res, next) => {
    const userAgent = req.headers['user-agent'];
  
    if (userAgent.includes('Linux')) {
      req.osType = 'Linux';
    } else if (userAgent.includes('Windows')) {
      req.osType = 'Windows';
    } else {
      req.osType = 'Other';
    }
  
    next();
  };
  