var express = require('express');
var router = express.Router();
var utils = require('../../controllers/utils');
var config = require('../../configuration')();

/* GET home page. */
router.get('/', function (req, res) {
    var page_config = config.page_config['index'] != null ? config.page_config['index'] : config.app_config;
    if (req.user == null) {
        res.render('index', page_config);
    } else {
        var new_config = utils.clone(page_config);
        new_config.user = req.user;
        res.render('index', new_config);
    }
});

module.exports = router;
