/**
 * n-i18n
 */

(function (root) {
    const EventEmitter = {
        addListener(name, fn) {
            let listeners = this._listeners || (this._listeners = {});
            let handlers = listeners[name] || (listeners[name] = []);
            handlers.push(fn);
        },
        removeListener(name, fn) {
            let listeners = (this._listeners || {})[name];
            if(listeners) listeners.splice(listeners.indexOf(fn), 1);
        },
        emit(name, ...args) {
            let listeners = (this._listeners || {})[name];
            if(listeners) {
                listeners.forEach(h => h.apply(this, ...args));
            }
        }
    };

    function Ni18n(conf){
        if(!(this instanceof Ni18n)) return new Ni18n(conf);
        this.init(conf);
    }

    Ni18n.prototype = {
        constructor: Ni18n,
        init(conf) {

        },
    }

    root.Ni18n = Ni18n;
}(this))