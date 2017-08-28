module.exports.initialize = function (base_config, pages) {
    var base_keys = Object.keys(base_config);
    var page_keys = Object.keys(pages);
    var config = {}, tmp_config, page_key, tmp_keys, tmp_key;
    for (var i = 0; i < page_keys.length; i++) {
        page_key = page_keys[i];
        tmp_config = {};
        tmp_keys = Object.keys(pages[page_key]);
        for (var j = 0; j < tmp_keys.length; j++) {
            tmp_key = tmp_keys[j];
            tmp_config[tmp_key] = pages[page_key][tmp_key];
        }
        for (var j = 0; j < base_keys.length; j++) {
            tmp_key = base_keys[j];
            tmp_config[tmp_key] = base_config[tmp_key];
        }
        config[page_key] = tmp_config;
    }
    return config;
}