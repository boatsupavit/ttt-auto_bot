const controller = require('../controllers/server.controller');

module.exports = function (app) {
     app.post('/', controller.main);
    // app.post('/', controller.findOTP);
}