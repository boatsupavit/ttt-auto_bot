// const { MongoClient, ObjectId, Decimal128 } = require("mongodb");
// // const { CONNECTION, DB } = require("../../config/db.connection");

// module.exports = () => {
//     return new Promise(async (resolve, reject) => {
//         // MongoClient.connect(CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
//         //     .then(dbs => (module.exports.MongoDB = dbs.db(DB), dbs))
//         //     .then(dbs => (module.exports.ObjectId = ObjectId, dbs))
//         //     .then(dbs => (module.exports.Decimal128 = Decimal128, dbs))
//         //     .then(dbs => resolve(dbs))
//         //     .catch(error => reject(error));
//         resolve();
//     });
// }

const { MongoClient } = require("mongodb");
// const { CONNECTION, DB } = require("../../config/db.connection");
const CONNECTION = "mongodb+srv://SA:mh4MJHcnXGtCq7bv@cluster0.wnaus.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const DB = "teatrueteam-staging";

module.exports = () => {
    return new Promise(async (resolve, reject) => {
        MongoClient.connect(CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
            .then(dbs => (module.exports.MongoDB = dbs.db(DB), dbs))
            .then(dbs => resolve(dbs))
            .catch(error => reject(error));
    });
}
