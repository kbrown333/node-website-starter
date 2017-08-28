var express = require('express');
var fs = require('fs');
var path = require('path');
var compressor = require('yuicompressor');
var __ = require('underscore');

module.exports.minify_all = function (config, root) {

    if (config == null || config.sources == null || config.sources.length == null) {
        console.log('Error minifying files: invalid source configuration');
        return;
    }

    if (root == null) { console.log('Error minifying files: root is null'); return; }

    var opts_css = config.css || {
        charset: 'utf8',
        type: 'css',
        nomunge: true,
        'line-break': 80
    };
    var opts_js = config.js || {
        charset: 'utf8',
        type: 'js',
        nomunge: true,
        'line-break': 80
    };

    var tasks = [];
    var load_finished = __.after(config.sources.length, function () {
        console.log('Minifcation Starting...');
        var minify_finished = __.after(tasks.length, function () {
            console.log('Minification Complete!');
        });
        tasks.forEach(function (item, index) {
            compressor.compress(item.old_file, item.opts, function (err, data) {
                if (err) {
                    minify_finished();
                    return;
                }
                fs.writeFile(item.new_file, data, function () {
                    minify_finished();
                });
            });
        });
    });

    var isMinified = function (fname, type) {
        if (type == 'css') {
            return fname.indexOf('.min.css') != -1;
        } else {
            return fname.indexOf('.min.js') != -1;
        }
    }

    var minify_suffix = function (fname, type) {
        if (type == 'css') {
            return fname.replace('.css', '.min.css');
        } else {
            return fname.replace('.js', '.min.js');
        }
    }

    var get_opts = function (type) {
        if (type == 'css') {
            return opts_css;
        } else {
            return opts_js;
        }
    }

    var source, start, old_file, new_file, opts;
    for (var i = 0; i < config.sources.length; i++) {
        src = config.sources[i];
        (function (source) {
            if (source.input == null || source.output == null || source.type == null) {
                return;
            }
            opts = get_opts(source.type);
            start = path.join(root, source.input);
            fs.readdir(start, function (err, files) {
                files.filter((val) => {
                    return (val.indexOf("." + source.type) > -1);
                }).forEach(function (file, index) {
                    if (!isMinified(file, source.type)) {
                        old_file = path.join(root, (source.input + file));
                        new_file = path.join(root, (source.output + minify_suffix(file, source.type)));
                        tasks.push({
                            new_file: new_file,
                            old_file: old_file,
                            opts: opts
                        });
                    }
                });
                load_finished();
            });
        })(src);
    }
}
