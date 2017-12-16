/**
 * n-i18n
 */

(function (root) {
    function Ni18n(conf){
        if(!(this instanceof Ni18n)) return new Ni18n(conf);
        this.init();
    }

    Ni18n.prototype = {
        constructor: Ni18n,
        init() {

        },
        setImageI18n() {

        },
        setClassI18n() {

        },
        setTextI18n() {

        }
    }

    root.Ni18n = Ni18n;
}(this))