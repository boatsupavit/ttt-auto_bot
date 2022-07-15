// (async () =>  {
//     try {
//         await require('./config/mongodb')();
//         await require('./config/express')(41700)
//             .then(app => require('./routes/server.route')(app))
            
//     }catch (error) {
//         console.error(error);
//     }
// })();

(async () => {
    const PORT = "41700";
    await Promise.all([await require("./build/mongodb")(), 
    await require("./build/express")()])
        .then(([, app]) => (require("./controllers/server.controller")(), app))
        .then(app => app.listen(PORT))
        .then(() => console.log(`server is running at ${PORT}`))
        .catch(error => console.error(error));
})();