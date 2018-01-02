/**
 * n-i18n
 * Develop by 1kg.
 */

(function (root) {
    const _ = {
        hasClass(ele, cls) {
            return (new RegExp('(\\s|^)' + cls + '(\\s|$)')).test(ele.className);
        },
        addClass(ele, cls) {
            if (!_.hasClass(ele, cls)) {
                ele.className += ' ' + cls;
            }
        },
        removeClass(ele, cls) {
            if (_.hasClass(ele, cls)) {
                var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
                ele.className = ele.className.replace(reg, ' ');
            }
        }
    };

    class EventEmitter {
        constructor() {}

        addListener(name, fn) {
            let listeners = this._listeners || (this._listeners = {});
            let handlers = listeners[name] || (listeners[name] = []);
            handlers.push(fn);
        }

        removeListener(name, fn) {
            let listeners = (this._listeners || {})[name];
            if (listeners) listeners.splice(listeners.indexOf(fn), 1);
        }

        emit(name, ...args) {
            let listeners = (this._listeners || {})[name];
            if (listeners) {
                listeners.forEach(h => h.apply(this, ...args));
            }
        }
    }

    class Ni18n extends EventEmitter {
        constructor(conf = {}) {
            super();
            this.init(conf);
        }

        init(conf) {
            this.$locale = conf.locale;
            this.$messages = conf.messages;
            this.$mount = document.querySelector(conf.selector) || document.body;
            this.$name = conf.name || 'i18n';
            this._$i18nDomMap = this.cached();
            this.setup();
        }
        // 遍历缓存需要多语言配置的所有DOM
        cached() {
            let name = this.$name;
            let tid = 0;
            let map = new Map();
            // 递归缓存
            (function _trace(parent) {
                const children = parent.children;
                const len = children.length;
                for(let i = 0; i < len; i++) {
                    const child =  children[i];
                    if(child.dataset[name]) {
                        map.set(`${name}#${++tid}`, child);
                    }
                    if(child.children.length > 0) {
                        _trace(child);
                    }
                }
            }(this.$mount));

            return map;
        }
        // 初始化，选择执行渲染函数
        setup() {
            const name = this.$name;
            const map = this._$i18nDomMap;
            const keys = [...map.keys()];
            for(let k of keys) {
                const v = map.get(k);
                const i18nStr = v.dataset[name].split(';');
                i18nStr.forEach(c => {
                    const _c = this.parse(c.trim());
                    if(c.includes('$t')){
                        this.render$t(v, _c);
                    }
                    if(c.includes('$h')) {
                        this.render$h(v, _c);
                    }
                    if(c.includes('$c')) {
                        this.render$c(v, _c);
                    }
                    if(c.includes('$m')) {
                        this.render$m(v, _c);
                    }
                })
            }
        }
        // 解析配置字符串
        parse(c) {
            const baseRe = /\$[t|h|c|m]\([\'|\"](.*?)[\'|\"]\,*\s*(.*)\)/g;
            const confRe = /(\w+)\:\s*[\'|\"](.+?)[\'|\"]/g;
            let base = '';
            let conf = Object.create(null);
            
            c.replace(baseRe, (match, $1, $2) => {
                base = $1;
                if($2) {
                    $2.replace(confRe, (match, $1, $2) => {
                       conf[$1] = $2; 
                    });
                }
            });

            return {
                base, conf
            };
        }
        // 纯文本渲染
        render$t(v, c) {
            console.log(c);
        }
        // HTML渲染
        render$h(v, c) {
            console.log(c);
        }
        // class渲染
        render$c(v, c) {
            console.log(c);
        }
        // 图片渲染
        render$m(v, c) {
            console.log(c);
        }
    }

    root.Ni18n = Ni18n;
}(this))