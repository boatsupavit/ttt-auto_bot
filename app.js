(async () =>  {
    try {
        await require('./config/mongodb')();
        await require('./config/express')(41700)
            .then(app => require('./routes/server.route')(app))
            
    }catch (error) {
        console.error(error);
    }
})();