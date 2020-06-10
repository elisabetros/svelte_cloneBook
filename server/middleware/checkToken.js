
let jwt = require('jsonwebtoken');
const config = require('../config/jwtKey');

let checkToken = (req, res, next) => {
  const header = req.headers['authorization'];
  let token;
    if(typeof header !== 'undefined') {
        const bearer = header.split(' ');
        token = bearer[1];
    }


  if (token) {
    jwt.verify(token, config.secretKey, (err, decoded) => {
      if (err) {
        return res.send({
          success: false,
          message: 'Token is not valid'
        });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.send({
      success: false,
      message: 'Auth token is not supplied'
    });
  }
};

module.exports = {
  checkToken: checkToken
}