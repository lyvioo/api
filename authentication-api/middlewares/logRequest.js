module.exports = (req, res, next) => {
  console.log('Requisição recebida de:', req.ip, 'para:', req.method, req.url);
  next();
};
