var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var configuration = require('./configuration')();

//EXRPESS IS THE FRAMEWORK FOR CREATING SERVERS
var app = express();

//THIS IS REGULAR CONFIGURATION STUFF
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(favicon(__dirname + '/public/favicon.ico'));

//COMPRESS OUTPUT AND PROTEXT AGAINST XSS
var gzip = require('compression');
app.use(gzip());
var xssFilter = require('x-xss-protection');
app.use(xssFilter());
app.disable('x-powered-by');

//CONSOLE LOGGING
var logger = require('morgan');
app.use(logger('dev'));

//VIEW ENGINE SETUP
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

//THIS SETS UP A STATIC RESOURCE FOLDER TO ACCESS PUBLIC FILES VIA HTTP
var cache_time = 86400000;
if (process.env.PROD_FLAG) {
    app.use(express.static(path.join(__dirname, 'public'), { maxAge: cache_time }));
} else {
    app.use(express.static(path.join(__dirname, 'public')));
}

//SITEMAP HANDLERS
sm = require('sitemap');
sitemap = sm.createSitemap(require('./config/sitemap.json'));

//LOAD MIDDLEWARE FUNCTIONS
//ssl redirect in production
if (process.env.PROD_FLAG && configuration.app_config.ssl) {
    app.get('*', function (req, res, next) {
        if (req.headers['x-forwarded-proto'] != 'https') {
            res.redirect(configuration.app_config.site_url_base + req.url);
        } else if (req.headers.host.search(/^www/) === -1) {
            res.redirect(301, configuration.app_config.site_url_base + req.url);
        } else if (req.headers['user-agent'] == 'Libwww-perl') {
            res.status(403).send('User Agent "Libwww-perl" not permitted. Using another browser should resolve this issue.');
        } else {
            next();
        }
    });
}

//Load Middleware Functions
//static pages
var mw_Home = require('./routes/static/index');
var mw_UknownError = require('./routes/static/unknown_error');
//api requests
var mw_Hello = require('./routes/hello');

//Route Paths to Middleware
////static-pages
app.use('/', mw_Home);
app.use('/unknown_error', mw_UknownError);
////api requests
app.use('/api/hello', mw_Hello);

//GENERATE SITEMAP
app.get('/sitemap.xml', function (req, res) {
    sitemap.toXML(function (err, xml) {
        if (err) {
            return res.status(500).end();
        }
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    });
});

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//ERROR HANDLERS
if (!process.env.PROD_FLAG) {
    // development error handler
    // will print stacktrace
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
} else {
    // production error handler
    // no stacktraces leaked to user
    // app.use(function (err, req, res, next) {
    //     console.dir(err);
    //     res.render('unknown_error', global.app_config);
    // });
}

var debug = require('debug')('IoTShaman');

//START SERVER
app.set('port', process.env.PORT || 3000);
var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});
console.log('Application available at port: ' + app.get('port'));

//MINIFY FILES
if (!process.env.PROD_FLAG) {
    try {
        var minify_config = require('./config/minify.json')
        require('./controllers/minify').minify_all(minify_config, __dirname);
    } catch (ex) {
        debug(ex.toString());
        console.log('Error minifying files, minification process terminated.');
    }
}

module.exports = app;