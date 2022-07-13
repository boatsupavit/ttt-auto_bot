module.exports = () => {
    return new Promise((resolve, reject) => {
        try {
            const app = require("express")();
            const bodyParser = require("body-parser");
            app.use((request, response, next) => {
                response.header("Access-Control-Allow-Origin", "*");
                response.header("Access-Control-Allow-Methods", "GET,POST,PUT");
                response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
                app.locals.pretty = true;
                return next();
            });
            app.use(bodyParser.urlencoded({ extended: true, limit: "100MB" }));
            app.use(bodyParser.json({ extended: true, limit: "100MB" }));
            resolve(app);
        } catch (error) {
            reject(error);
        }
    });
}