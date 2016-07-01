/**
 * Created by tekka_000 on 2015/9/10.
 */

function SimpleTemplate(str) {
    this.template = str || '';
}

SimpleTemplate.prototype.render = function(obj) {
    this.data = obj || {};
    this.str = this.template.replace(/\{\{([^{}]+)\}\}/gm, function(str, p, i, s) {
        return obj[p];
    });
    return this.str;
};

module.exports = SimpleTemplate;