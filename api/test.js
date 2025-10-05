module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'API Test works!',
    method: req.method,
    timestamp: new Date().toISOString()
  });
};
