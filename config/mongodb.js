const  { MongoClient,ObjectID } = require("mongodb");
const {CONN,DB} = require('../config/dbCon');

module.exports = () => {
    return new Promise(async (resolve, reject) => {
        MongoClient.connect(CONN, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(dbs => resolve(module.exports.MongoDB = dbs.db(DB)))
            .catch(error => reject(error));
            
    });
}