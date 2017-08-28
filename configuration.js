var config;

module.exports = function() {

    if (config != null) { return config; }

    config = {};
    console.log('Generating configuration object');

    //LOAD APPLICATION CONFIGURATION OBJECTS
    try {
        config.app_config = require('./config/global.json');
        config.app_config['is_prod'] = (process.env.PROD_FLAG ? true : false);
        var pages = require('./config/page_config.json');
        config.page_config = require('./controllers/variables').initialize(config.app_config, pages);
    } catch (ex) {
        console.dir(ex);
        console.log('Cannot load app config');
    }

    //LOAD CONFIDENTIAL INFORMATION
    try {
        //IF RUNNING LOCALLY, USE A SECRETS OBJECT (DO NOT COMMIT)
        config.secrets = require('./config/secrets.json');
    } catch (ex) {
        //WHEN RUNNING ON SERVER, STORE VARIABLES IN ENVIRONMENT CONFIG
        try {
            config.secrets = {};
            var map = require('./config/secret_map.json');
            var keys = Object.keys(map);
            for (var i = 0; i < keys.length; i++) {
                config.secrets[keys[i]] = process.env[keys[i]];
            }
        } catch (ex2) {
            console.dir(ex2);
            console.log('Error mapping secrets from environment variables.')
        }
    }

    return config;
}