/**
 * n-i18n
 * Develop by 1kg.
 * version b: use it in more complex cases.
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
                let reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
                ele.className = ele.className.replace(reg, ' ');
            }
        },
        isPrimitive(value) {
            return (
                typeof value === 'string' ||
                typeof value === 'number' ||
                typeof value === 'boolean'
            );
        },
        // 以a.b.c形式获取对象属性
        getValueBy(obj, keystr) {
            const keyset = keystr.split('.');
            for (let i = 0, len = keyset.length; i < len; i++) {
                let v = obj[keyset[i]];
                if (v || _.isPrimitive(v)) {
                    obj = v;
                }
            }
            return _.isPrimitive(obj) ? obj : '';;
        }
    };

    class EventEmitter {
        constructor() {
            this._listeners = {};
        }

        addListener(name, fn) {
            let listeners = this._listeners;
            let handlers = listeners[name] || (listeners[name] = []);
            handlers.push(fn);
        }

        removeListener(name, fn) {
            let listeners = this._listeners[name];
            if (listeners) listeners.splice(listeners.indexOf(fn), 1);
        }

        emit(name, ...args) {
            let listeners = this._listeners[name];
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
            this.$localeMsgs = conf.messages[conf.locale];
            this.$data = conf.data;
            this.$mount = document.querySelector(conf.selector) || document.body;
            this.$name = conf.name || 'i18n';
            if (!this.$localeMsgs) {
                this._warn(`messages can't find the key '${conf.locale}'`);
                return;
            }
            this.$cached = this.cached();
            this.$dep = Object.create(null);
            this.initObervser();
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
                for (let i = 0, len = children.length; i < len; i++) {
                    const child = children[i];
                    if (child.dataset[name]) {
                        map.set(`${name}#${++tid}`, child);
                    }
                    if (child.children.length > 0) {
                        _trace(child);
                    }
                }
            }(this.$mount));

            return map;
        }

        // 初始化，选择执行渲染函数
        setup() {
            const self = this;
            const map = this.$cached;
            const keys = [...map.keys()];
            for (let k of keys) {
                const v = map.get(k);
                self.renderBase(v);
            }
        }

        renderBase(v) {
            const name = this.$name;
            const dataI18n = v.dataset[name].split(';');
            dataI18n.forEach(c => {
                const _c = this.parse(v, c.trim());
                if (c.includes('$t')) {
                    this.render$t(v, _c);
                }
                if (c.includes('$h')) {
                    this.render$h(v, _c);
                }
                if (c.includes('$c')) {
                    this.render$c(v, _c);
                }
                if (c.includes('$m')) {
                    this.render$m(v, _c);
                }
            });
        }

        // 对应观察数据绑定视图
        addDep(path, v) {
            const depKey = '$' + path.replace(/\.|\[|\]/g, '_');
            const depArr = this.$dep[depKey];
            if (depArr && depArr.includes(v)) {
                return;
            } else {
                if (!depArr) {
                    this.$dep[depKey] = [];
                }
                this.$dep[depKey].push(v);
            }
            const _depArr = this.$dep[depKey];
            this.addListener(depKey, () => {
                _depArr.forEach(v => {
                    this.renderBase(v);
                });
            });
        }

        // 注册数据观察
        initObervser() {
            const self = this;
            let level = -1,
                path = [];

            walk(this.$data);

            function walk(obj) {
                if (typeof obj === 'object') {
                    level++;
                    if (Array.isArray(obj)) {
                        for (let i = 0, len = obj.length; i < len; i++) {
                            path[level] = i;
                            defineReactive(obj, i, obj[i], level, path);
                            walk(obj[i]);
                        }
                    } else {
                        let keys = Object.keys(obj);
                        for (let key of keys) {
                            path[level] = key;
                            defineReactive(obj, key, obj[key], level, path);
                            walk(obj[key]);
                        }
                    }
                    level--;
                }
            }

            function defineReactive(obj, key, val, level, path) {
                const keyPath = path.slice(0, level + 1);

                Object.defineProperty(obj, key, {
                    enumerable: true,
                    configurable: true,
                    get() {
                        return val;
                    },
                    set: newVal => {
                        if (val === newVal) return;
                        val = newVal;
                        // 修改了数据，此时通知视图更新
                        const depKey = '$' + keyPath.join('_');
                        self.emit(depKey);
                    }
                });
            }
        }

        // 解析配置字符串
        parse(v, c) {
            const baseRe = /\$[t|h|c|m]\(['"](.*?)['"]\,*\s*(.*)\)/g;
            const confRe = /(\w+)\:\s*([^,}]+)/g;
            const quoteRe = /^['"]|['"]$/gm;
            let base = '';
            let conf = Object.create(null);

            c.replace(baseRe, (match, $1, $2) => {
                base = $1;
                if ($2) {
                    $2.replace(confRe, (match, $1, $2) => {
                        if (quoteRe.test($2)) {
                            // 静态字符串
                            conf[$1] = $2.replace(quoteRe, '');
                        } else {
                            if ($2.indexOf('@') === 0) {
                                // 动态配置数据
                                $2 = $2.slice(1);
                            }
                            this.addDep($2, v);
                            // 暂时不处理数组情况
                            conf[$1] = _.getValueBy(this.$data, $2);
                        }
                    });
                }
            });

            return {
                base,
                conf
            };
        }

        insertMsg(text, data) {
            const keys = Object.keys(data);
            for (let i = 0, len = keys.length; i < len; i++) {
                let keyRe = new RegExp('{' + keys[i] + '}', 'g');
                text = text.replace(keyRe, data[keys[i]]);
            }
            return text;
        }

        renderMsg(c) {
            return this.insertMsg(
                _.getValueBy(this.$localeMsgs, c.base),
                c.conf
            );
        }

        // 纯文本渲染
        render$t(v, c) {
            v.innerText = this.renderMsg(c);
        }

        // HTML渲染
        render$h(v, c) {
            v.innerHTML = this.renderMsg(c);
        }

        // class渲染
        render$c(v, c) {
            const locale = this.$locale;
            const langs = Object.keys(this.$messages);
            for (let i = 0, len = langs.length; i < len; i++) {
                if (langs[i] !== locale) {
                    _.removeClass(v, `${langs[i]}-${c.base}`);
                }
            }
            _.addClass(v, `${locale}-${c.base}`)
        }

        // 图片渲染
        render$m(v, c) {
            const locale = this.$locale;
            const langs = Object.keys(this.$messages).join('|');
            const nameRe = new RegExp('(\/(' + langs + '))?\/[^\/]+(?=\\.[^\/]*$)', 'g');
            const src = v.getAttribute('src');
            const path = src.replace(nameRe, `/${locale}/${c.base}`);

            v.setAttribute('src', path);
        }

        _log(...args) {
            console.log('Ni18n Log: [', ...args, ']');
        }

        _warn(...args) {
            console.warn('Ni18n Warn: [', ...args, ']');
        }
    }

    root.Ni18n = Ni18n;
}(this));