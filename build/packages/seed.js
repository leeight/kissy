/*
Copyright 2010, KISSY UI Library v1.1.2
MIT Licensed
build time: Aug 18 12:10
*/
/**
 * @module kissy
 * @author lifesinger@gmail.com
 */
(function(win, S, undefined) {

    // If KISSY is already defined, the existing KISSY object will not
    // be overwritten so that defined namespaces are preserved.
    if (win[S] === undefined) win[S] = {};
    S = win[S]; // shortcut

    var doc = win['document'], loc = location,
        EMPTY = '',

        // Copies all the properties of s to r
        mix = function(r, s, ov, wl) {
            if (!s || !r) return r;
            if (ov === undefined) ov = true;
            var i, p, l;

            if (wl && (l = wl.length)) {
                for (i = 0; i < l; i++) {
                    p = wl[i];
                    if (p in s) {
                        if (ov || !(p in r)) {
                            r[p] = s[p];
                        }
                    }
                }
            } else {
                for (p in s) {
                    if (ov || !(p in r)) {
                        r[p] = s[p];
                    }
                }
            }
            return r;
        },

        // Is the DOM ready to be used? Set to true once it occurs.
        isReady = false,

        // The functions to execute on DOM ready.
        readyList = [],

        // Has the ready events already been bound?
        readyBound = false,

        // The number of poll times.
        POLL_RETRYS = 500,

        // The poll interval in milliseconds.
        POLL_INTERVAL = 40,

        // #id or id
        RE_IDSTR = /^#?([\w-]+)$/,

        // global unique id
        guid = 0;

    mix(S, {

        /**
         * The version of the library.
         * @type {String}
         */
        version: '1.1.2',

        /**
         * Initializes KISSY object.
         */
        _init: function() {
            // 环境信息
            this.Env = {
                mods: { }, // �?��模块列表
                _loadingQueue: { } // 正在加载中的模块信息
            };

            // 配置信息
            this.Config = {
                debug: '@DEBUG@', // build 时，会将 @DEBUG@ 替换为空
                base: 'http://a.tbcdn.cn/s/kissy/1.1.2/build/',
                timeout: 10   // getScript 的默�?timeout 时间
            };
        },

        /**
         * Specify a function to execute when the DOM is fully loaded.
         * @param fn {Function} A function to execute after the DOM is ready
         * <code>
         * KISSY.ready(function(S){ });
         * </code>
         * @return {KISSY}
         */
        ready: function(fn) {
            var self = this;

            // Attach the listeners
            if (!readyBound) self._bindReady();

            // If the DOM is already ready
            if (isReady) {
                // Execute the function immediately
                fn.call(win, self);
            } else {
                // Remember the function for later
                readyList.push(fn);
            }

            return self;
        },

        /**
         * Binds ready events.
         */
        _bindReady: function() {
            var self = this,
                doScroll = doc.documentElement.doScroll,
                eventType = doScroll ? 'onreadystatechange' : 'DOMContentLoaded',
                COMPLETE = 'complete',
                fire = function() {
                    self._fireReady();
                };

            // Set to true once it runs
            readyBound = true;

            // Catch cases where ready() is called after the
            // browser event has already occurred.
            if (doc.readyState === COMPLETE) {
                return fire();
            }

            // w3c mode
            if (doc.addEventListener) {
                function domReady() {
                    doc.removeEventListener(eventType, domReady, false);
                    fire();
                }

                doc.addEventListener(eventType, domReady, false);

                // A fallback to window.onload, that will always work
                win.addEventListener('load', fire, false);
            }
            // IE event model is used
            else {
                function stateChange() {
                    if (doc.readyState === COMPLETE) {
                        doc.detachEvent(eventType, stateChange);
                        fire();
                    }
                }

                // ensure firing before onload, maybe late but safe also for iframes
                doc.attachEvent(eventType, stateChange);

                // A fallback to window.onload, that will always work.
                win.attachEvent('onload', fire);

                if (win == win.top) { // not an iframe
                    function readyScroll() {
                        try {
                            // Ref: http://javascript.nwbox.com/IEContentLoaded/
                            doScroll('left');
                            fire();
                        } catch(ex) {
                            setTimeout(readyScroll, 1);
                        }
                    }

                    readyScroll();
                }
            }
        },

        /**
         * Executes functions bound to ready event.
         */
        _fireReady: function() {
            if (isReady) return;

            // Remember that the DOM is ready
            isReady = true;

            // If there are functions bound, to execute
            if (readyList) {
                // Execute all of them
                var fn, i = 0;
                while (fn = readyList[i++]) {
                    fn.call(win, this);
                }

                // Reset the list of functions
                readyList = null;
            }
        },

        /**
         * Executes the supplied callback when the item with the supplied id is found.
         * @param id <String> The id of the element, or an array of ids to look for.
         * @param fn <Function> What to execute when the element is found.
         */
        available: function(id, fn) {
            id = (id + EMPTY).match(RE_IDSTR)[1];
            if (!id || !S.isFunction(fn)) return;

            var retryCount = 1,

                timer = S.later(function() {
                    if (doc.getElementById(id) && (fn() || 1) || ++retryCount > POLL_RETRYS) {
                        timer.cancel();
                    }

                }, POLL_INTERVAL, true);
        },

        /**
         * Copies all the properties of s to r.
         * @return {Object} the augmented object
         */
        mix: mix,

        /**
         * Returns a new object containing all of the properties of
         * all the supplied objects. The properties from later objects
         * will overwrite those in earlier objects. Passing in a
         * single object will create a shallow copy of it.
         * @return {Object} the new merged object
         */
        merge: function() {
            var o = {}, i, l = arguments.length;
            for (i = 0; i < l; ++i) {
                mix(o, arguments[i]);
            }
            return o;
        },

        /**
         * Applies prototype properties from the supplier to the receiver.
         * @return {Object} the augmented object
         */
        augment: function(/*r, s1, s2, ..., ov, wl*/) {
            var args = arguments, len = args.length - 2,
                r = args[0], ov = args[len], wl = args[len + 1],
                i = 1;

            if (!S.isArray(wl)) {
                ov = wl;
                wl = undefined;
                len++;
            }

            if (!S.isBoolean(ov)) {
                ov = undefined;
                len++;
            }

            for (; i < len; i++) {
                mix(r.prototype, args[i].prototype || args[i], ov, wl);
            }

            return r;
        },

        /**
         * Utility to set up the prototype, constructor and superclass properties to
         * support an inheritance strategy that can chain constructors and methods.
         * Static members will not be inherited.
         * @param r {Function} the object to modify
         * @param s {Function} the object to inherit
         * @param px {Object} prototype properties to add/override
         * @param sx {Object} static properties to add/override
         * @return r {Object}
         */
        extend: function(r, s, px, sx) {
            if (!s || !r) return r;

            var OP = Object.prototype,
                O = function (o) {
                    function F() {
                    }

                    F.prototype = o;
                    return new F();
                },
                sp = s.prototype,
                rp = O(sp);

            r.prototype = rp;
            rp.constructor = r;
            r.superclass = sp;

            // assign constructor property
            if (s !== Object && sp.constructor === OP.constructor) {
                sp.constructor = s;
            }

            // add prototype overrides
            if (px) {
                mix(rp, px);
            }

            // add object overrides
            if (sx) {
                mix(r, sx);
            }

            return r;
        },

        /**
         * Returns the namespace specified and creates it if it doesn't exist. Be careful
         * when naming packages. Reserved words may work in some browsers and not others.
         * <code>
         * S.namespace('KISSY.app'); // returns KISSY.app
         * S.namespace('app.Shop'); // returns KISSY.app.Shop
         * </code>
         * @return {Object}  A reference to the last namespace object created
         */
        namespace: function() {
            var l = arguments.length, o = null, i, j, p;

            for (i = 0; i < l; ++i) {
                p = (EMPTY + arguments[i]).split('.');
                o = this;
                for (j = (win[p[0]] === o) ? 1 : 0; j < p.length; ++j) {
                    o = o[p[j]] = o[p[j]] || {};
                }
            }
            return o;
        },

        /**
         * create app based on KISSY.
         * @param name {String} the app name
         * @param sx {Object} static properties to add/override
         * <code>
         * S.app('TB');
         * TB.namespace('app'); // returns TB.app
         * </code>
         * @return {Object}  A reference to the app global object
         */
        app: function(name, sx) {
            var O = win[name] || {};

            mix(O, this, true, S._APP_MEMBERS);
            O._init();

            return mix((win[name] = O), S.isFunction(sx) ? sx() : sx);
        },

        /**
         * Prints debug info.
         * @param msg {String} the message to log.
         * @param cat {String} the log category for the message. Default
         *        categories are "info", "warn", "error", "time" etc.
         * @param src {String} the source of the the message (opt)
         */
        log: function(msg, cat, src) {
            if (S.Config.debug) {
                if (src) {
                    msg = src + ': ' + msg;
                }
                if (win['console'] !== undefined && console.log) {
                    console[cat && console[cat] ? cat : 'log'](msg);
                }
            }
        },

        /**
         * Throws error message.
         */
        error: function(msg) {
            if (S.Config.debug) {
                throw msg;
            }
        },

        /*
         * Generate a global unique id.
         * @param pre {String} optional guid prefix
         * @return {String} the guid
         */
        guid: function(pre) {
            var id = guid++ + EMPTY;
            return pre ? pre + id : id;
        }
    });

    S._init();

    // S.app() 时，�?��动�?复制的成员列�?
    S._APP_MEMBERS = ['_init', 'namespace'];

    // 可以通过�?url 上加 ?ks-debug 参数来强制开�?debug 模式
    if (loc && (loc.search || EMPTY).indexOf('ks-debug') !== -1) {
        S.Config.debug = true;
    }

})(window, 'KISSY');

/**
 * NOTES:
 *
 * 2010/08
 *  - �?loader 功能独立�?loader.js �?
 *
 * 2010/07
 *  - 增加 available �?guid 方法
 *
 * 2010/04
 *  - 移除�?weave 方法，鸡�?
 *
 * 2010/01
 *  - add 方法决定内部代码的基本组织方式（�?module �?submodule 来组织代码）
 *  - ready, available 方法决定外部代码的基本调用方式，提供了一个简单的弱沙�?
 *  - mix, merge, augment, extend 方法，决定了类库代码的基本实现方式，充分利用 mixin 特�?�?prototype 方式来实现代�?
 *  - namespace, app 方法，决定子库的实现和代码的整体组织
 *  - log, error 方法，简单的调试工具和报错机�?
 *  - guid 方法，全�?��助方�?
 *  - 考虑�?��够用�?2/8 原则，去掉对 YUI3 沙箱的模拟�?（archives/2009 r402�?
 *
 */
/**
 * @module  lang
 * @author  lifesinger@gmail.com
 */
(function(win, S, undefined) {

    var doc = document, docElem = doc.documentElement,
        AP = Array.prototype,
        indexOf = AP.indexOf, lastIndexOf = AP.lastIndexOf, filter = AP.filter,
        trim = String.prototype.trim,
        toString = Object.prototype.toString,
        encode = encodeURIComponent,
        decode = decodeURIComponent,
        HAS_OWN_PROPERTY = 'hasOwnProperty',
        EMPTY = '', SEP = '&',
        REG_TRIM = /^\s+|\s+$/g,
        REG_ARR_KEY = /^(\w+)\[\]$/,
        REG_NOT_WHITE = /\S/;

    S.mix(S, {

        /**
         * Determines whether or not the provided object is undefined.
         */
        isUndefined: function(o) {
            return o === undefined;
        },

        /**
         * Determines whether or not the provided object is a boolean.
         */
        isBoolean: function(o) {
            return typeof o === 'boolean';
        },

        /**
         * Determines whether or not the provided object is a string.
         */
        isString: function(o) {
            return typeof o === 'string';
        },

        /**
         * Determines whether or not the provided item is a legal number.
         * NOTICE: Infinity and NaN return false.
         */
        isNumber: function(o) {
            return typeof o === 'number' && isFinite(o);
        },

        /**
         * Checks to see if an object is a plain object (created using "{}" or "new Object").
         */
        isPlainObject: function(o) {
            // Make sure that DOM nodes and window objects don't pass through.
            return o && toString.call(o) === '[object Object]' && !o['nodeType'] && !o['setInterval'];
        },

        /**
         * Checks to see if an object is empty.
         */
        isEmptyObject: function(o) {
            for (var p in o) {
                return false;
            }
            return true;
        },

        /**
         * Determines whether or not the provided object is a function.
         * NOTICE: DOM methods and functions like alert aren't supported. They return false on IE.
         */
        isFunction: function(o) {
            //return typeof o === 'function';
            // Safari 下，typeof NodeList 也返�?function
            return toString.call(o) === '[object Function]';
        },

        /**
         * Determines whether or not the provided object is an array.
         */
        isArray: function(o) {
            return toString.call(o) === '[object Array]';
        },

        /**
         * Removes the whitespace from the beginning and end of a string.
         */
        trim: trim ?
            function(str) {
                return (str == undefined) ? EMPTY : trim.call(str);
            } :
            function(str) {
                return (str == undefined) ? EMPTY : str.toString().replace(REG_TRIM, EMPTY);
            },

        /**
         * Substitutes keywords in a string using an object/array.
         * Removes undefined keywords and ignores escaped keywords.
         */
        substitute: function(str, o, regexp) {
            if(!S.isString(str) || !S.isPlainObject(o)) return str;

            return str.replace(regexp || /\\?\{([^{}]+)\}/g, function(match, name) {
                if (match.charAt(0) === '\\') return match.slice(1);
                return (o[name] !== undefined) ? o[name] : EMPTY;
            });
        },

        /**
         * Executes the supplied function on each item in the array.
         * @param object {Object} the object to iterate
         * @param fn {Function} the function to execute on each item. The function
         *        receives three arguments: the value, the index, the full array.
         * @param context {Object} (opt)
         */
        each: function(object, fn, context) {
            var key, val, i = 0, length = object.length,
                isObj = length === undefined || S.isFunction(object);
            context = context || win;
            
            if (isObj) {
                for (key in object) {
                    if (fn.call(context, object[key], key, object) === false) {
                        break;
                    }
                }
            } else {
                for (val = object[0];
                     i < length && fn.call(context, val, i, object) !== false; val = object[++i]) {
                }
            }

            return object;
        },

        /**
         * Search for a specified value within an array.
         */
        indexOf: indexOf ?
            function(item, arr) {
                return indexOf.call(arr, item);
            } :
            function(item, arr) {
                for (var i = 0, len = arr.length; i < len; ++i) {
                    if (arr[i] === item) {
                        return i;
                    }
                }
                return -1;
            },

        /**
         * Returns the index of the last item in the array
         * that contains the specified value, -1 if the
         * value isn't found.
         */
        lastIndexOf: (lastIndexOf) ?
            function(item, arr) {
                return lastIndexOf.call(arr, item);
            } :
            function(item, arr) {
                for (var i = arr.length - 1; i >= 0; i--) {
                    if (arr[i] === item) {
                        break;
                    }
                }
                return i;
            },

        /**
         * Returns a copy of the array with the duplicate entries removed
         * @param a {Array} the array to find the subset of uniques for
         * @return {Array} a copy of the array with duplicate entries removed
         */
        unique: function(a, override) {
            if(override) a.reverse(); // 默认是后置删除，如果 override �?true, 则前置删�?
            var b = a.slice(), i = 0, n, item;

            while (i < b.length) {
                item = b[i];
                while ((n = S.lastIndexOf(item, b)) !== i) {
                    b.splice(n, 1);
                }
                i += 1;
            }

            if(override) b.reverse(); // 将顺序转回来
            return b;
        },
        
        /**
         * Search for a specified value index within an array.
         */
        inArray: function(item, arr) {
            return S.indexOf(item, arr) > -1;
        },

        /**
         * Converts object to a true array.
         */
        makeArray: function(o) {
            if (o === null || o === undefined) return [];
            if (S.isArray(o)) return o;

            // The strings and functions also have 'length'
            if (typeof o.length !== 'number' || S.isString(o) || S.isFunction(o)) {
                return [o];
            }

            return slice2Arr(o);
        },

        /**
         * Executes the supplied function on each item in the array.
         * Returns a new array containing the items that the supplied
         * function returned true for.
         * @param arr {Array} the array to iterate
         * @param fn {Function} the function to execute on each item
         * @param context {Object} optional context object
         * @return {Array} The items on which the supplied function
         *         returned true. If no items matched an empty array is
         *         returned.
         */
        filter: filter ?
            function(arr, fn, context) {
                return filter.call(arr, fn, context);
            } :
            function(arr, fn, context) {
                var ret = [];
                S.each(arr, function(item, i, arr) {
                    if (fn.call(context, item, i, arr)) {
                        ret.push(item);
                    }
                });
                return ret;
            },

        /**
         * Creates a serialized string of an array or object.
         * <code>
         * {foo: 1, bar: 2}    // -> 'foo=1&bar=2'
         * {foo: 1, bar: [2, 3]}    // -> 'foo=1&bar[]=2&bar[]=3'
         * {foo: '', bar: 2}    // -> 'foo=&bar=2'
         * {foo: undefined, bar: 2}    // -> 'foo=undefined&bar=2'
         * {foo: true, bar: 2}    // -> 'foo=true&bar=2'
         * </code>
         */
        param: function(o, sep) {
            // �?plain object, 直接返回�?
            if (!S.isPlainObject(o)) return EMPTY;
            sep = sep || SEP;

            var buf = [], key, val;
            for (key in o) {
                val = o[key];
                key = encode(key);

                // val 为有效的非数组�?
                if (isValidParamValue(val)) {
                    buf.push(key, '=', encode(val + EMPTY), sep);
                }
                // val 为非空数�?
                else if (S.isArray(val) && val.length) {
                    for (var i = 0, len = val.length; i < len; ++i) {
                        if (isValidParamValue(val[i])) {
                            buf.push(key, '[]=', encode(val[i] + EMPTY), sep);
                        }
                    }
                }
                // 其它情况：包括空数组、不是数组的 object（包�?Function, RegExp, Date etc.），直接丢弃
            }
            buf.pop();
            return buf.join(EMPTY);
        },

        /**
         * Parses a URI-like query string and returns an object composed of parameter/value pairs.
         * <code>
         * 'section=blog&id=45'        // -> {section: 'blog', id: '45'}
         * 'section=blog&tag[]=js&tag[]=doc' // -> {section: 'blog', tag: ['js', 'doc']}
         * 'tag=ruby%20on%20rails'        // -> {tag: 'ruby on rails'}
         * 'id=45&raw'        // -> {id: '45', raw: ''}
         * </code>
         */
        unparam: function(str, sep) {
            if (typeof str !== 'string' || (str = S.trim(str)).length === 0) return {};

            var ret = {},
                pairs = str.split(sep || SEP),
                pair, key, val, m,
                i = 0, len = pairs.length;

            for (; i < len; ++i) {
                pair = pairs[i].split('=');
                key = decode(pair[0]);

                // pair[1] 可能包含 gbk 编码的中文，�?decodeURIComponent 仅能处理 utf-8 编码的中文，否则报错
                try {
                    val = decode(pair[1] || EMPTY);
                } catch (ex) {
                    val = pair[1] || EMPTY;
                }

                if ((m = key.match(REG_ARR_KEY)) && m[1]) {
                    ret[m[1]] = ret[m[1]] || [];
                    ret[m[1]].push(val);
                } else {
                    ret[key] = val;
                }
            }
            return ret;
        },

        /**
         * Executes the supplied function in the context of the supplied
         * object 'when' milliseconds later. Executes the function a
         * single time unless periodic is set to true.
         * @param fn {Function|String} the function to execute or the name of the method in
         *        the 'o' object to execute.
         * @param when {Number} the number of milliseconds to wait until the fn is executed.
         * @param periodic {Boolean} if true, executes continuously at supplied interval
         *        until canceled.
         * @param o {Object} the context object.
         * @param data [Array] that is provided to the function. This accepts either a single
         *        item or an array. If an array is provided, the function is executed with
         *        one parameter for each array item. If you need to pass a single array
         *        parameter, it needs to be wrapped in an array [myarray].
         * @return {Object} a timer object. Call the cancel() method on this object to stop
         *         the timer.
         */
        later: function(fn, when, periodic, o, data) {
            when = when || 0;
            o = o || { };
            var m = fn, d = S.makeArray(data), f, r;

            if (S.isString(fn)) {
                m = o[fn];
            }

            if (!m) {
                S.error('method undefined');
            }

            f = function() {
                m.apply(o, d);
            };

            r = (periodic) ? setInterval(f, when) : setTimeout(f, when);

            return {
                id: r,
                interval: periodic,
                cancel: function() {
                    if (this.interval) {
                        clearInterval(r);
                    } else {
                        clearTimeout(r);
                    }
                }
            };
        },

        /**
         * Creates a deep copy of a plain object or array. Others are returned untouched.
         */
        clone: function(o) {
            var ret = o, b, k;

            // array or plain object
            if (o && ((b = S.isArray(o)) || S.isPlainObject(o))) {
                ret = b ? [] : {};
                for (k in o) {
                    if (o[HAS_OWN_PROPERTY](k)) {
                        ret[k] = S.clone(o[k]);
                    }
                }
            }

            return ret;
        },

        /**
         * Gets current date in milliseconds.
         */
        now: function() {
            return new Date().getTime();
        },

        /**
         * Evalulates a script in a global context.
         */
        globalEval: function(data) {
            if (data && REG_NOT_WHITE.test(data)) {
                // Inspired by code by Andrea Giammarchi
                // http://webreflection.blogspot.com/2007/08/global-scope-evaluation-and-dom.html
                var head = doc.getElementsByTagName('head')[0] || docElem,
                    script = doc.createElement('script');

                // It works! All browsers support!
                script.text = data;

                // Use insertBefore instead of appendChild to circumvent an IE6 bug.
                // This arises when a base node is used.
                head.insertBefore(script, head.firstChild);
                head.removeChild(script);
            }
        }
    });

    function isValidParamValue(val) {
        var t = typeof val;
        // val �?null, undefined, number, string, boolean 时，返回 true
        return val === null || (t !== 'object' && t !== 'function');
    }

    // �?NodeList 等集合转换为普�?数组
    function slice2Arr(arr) {
        return AP.slice.call(arr);
    }
    // ie 不支持用 slice 转换 NodeList, 降级到普通方�?
    try {
        slice2Arr(docElem.childNodes);
    }
    catch(e) {
        slice2Arr = function(arr) {
            for (var ret = [], i = arr.length - 1; i >= 0; i--) {
                ret[i] = arr[i];
            }
            return ret;
        }
    }

})(window, KISSY);

/**
 * NOTES:
 *
 *  2010/08
 *   - 增加 lastIndexOf �?unique 方法�?
 *
 *  2010/06
 *   - unparam 里的 try catch 让人很难受，但为了顺应国情，决定还是留着�?
 *
 *  2010/05
 *   - 增加 filter 方法�?
 *   - globalEval 中，直接采用 text 赋�?，去�?appendChild 方式�?
 *
 *  2010/04
 *   - param �?unparam 应该放在�?��地方合�?？有点纠结，目前暂放此处�?
 *   - param �?unparam 是不完全可�?的�?对空值的处理�?cookie 保持�?���?
 *
 */
/**
 * @module loader
 * @author lifesinger@gmail.com, lijing00333@163.com
 */
(function(win, S, undefined) {

    var doc = win['document'],
        head = doc.getElementsByTagName('head')[0] || doc.documentElement,
        EMPTY = '',
        LOADING = 1, LOADED = 2, ERROR = 3, ATTACHED = 4,
        mix = S.mix,

        scriptOnload = doc.createElement('script').readyState ?
            function(node, callback) {
                var oldCallback = node.onreadystatechange;
                node.onreadystatechange = function() {
                    var rs = node.readyState;
                    if (rs === 'loaded' || rs === 'complete') {
                        node.onreadystatechange = null;
                        oldCallback && oldCallback();
                        callback.call(this);
                    }
                };
            } :
            function(node, callback) {
                var oldCallback = node.onload;
                node.onload = function() {
                    oldCallback && oldCallback();
                    callback();
                };
            },

        RE_CSS = /\.css(?:\?|$)/i,
        loader;

    loader = {

        /**
         * Registers a module.
         * @param name {String} module name
         * @param fn {Function} entry point into the module that is used to bind module to KISSY
         * @param config {Object}
         * <code>
         * KISSY.add('module-name', function(S){ }, requires: ['mod1']);
         * </code>
         * <code>
         * KISSY.add({
         *     'mod-name': {
         *         fullpath: 'url',
         *         requires: ['mod1','mod2']
         *     }
         * });
         * </code>
         * @return {KISSY}
         */
        add: function(name, fn, config) {
            var self = this, mods = self.Env.mods, mod, o;

            // S.add(name, config) => S.add( { name: config } )
            if (S.isString(name) && !config && S.isPlainObject(fn)) {
                o = {};
                o[name] = fn;
                name = o;
            }

            // S.add( { name: config } )
            if (S.isPlainObject(name)) {
                S.each(name, function(v, k) {
                    v.name = k;
                });
                mix(mods, name);
            }
            // S.add(name[, fn[, config]])
            else {
                // 注意：�?�?S.add(name[, fn[, config]]) 注册的代码，无论是页面中的代码，�?
                //      �?js 文件里的代码，add 执行时，都意味着该模块已�?LOADED
                mix((mod = mods[name] || { }), { name: name, fn: fn, status: LOADED });
                mix((mods[name] = mod), config);

                // 对于 requires 都已 attached 的模块，比如 core 中的模块，直�?attach
                if (self._isAttached(mod.requires)) {
                    self._attachMod(mod);
                }
            }

            return self;
        },

        /**
         * Start load specific mods, and fire callback when these mods and requires are attached.
         * <code>
         * S.use('mod-name', callback);
         * S.use('mod1,mod2', callback);
         * S.use('mod1+mod2,mod3', callback); 暂不实现
         * S.use('*', callback);  暂不实现
         * S.use('*+', callback); 暂不实现
         * </code>
         */
        use: function(modNames, callback) {
            modNames = modNames.replace(/\s+/g, EMPTY).split(',');

            var self = this, mods = self.Env.mods,
                i = 0, len = modNames.length, mod, fired;

            // 已经全部 attached, 直接执行回调即可
            if (self._isAttached(modNames)) {
                callback && callback(self);
                return;
            }

            // 有尚�?attached 的模�?
            for (; i < len && (mod = mods[modNames[i++]]);) {
                if (mod.status === ATTACHED) continue;

                self._attach(mod, function() {
                    if (!fired && self._isAttached(modNames)) {
                        fired = true;
                        callback && callback(self);
                    }
                });
            }

            return self;
        },

        /**
         * Attach a module and all required modules.
         */
        _attach: function(mod, callback) {
            var self = this, requires = mod['requires'] || [],
                i = 0, len = requires.length;

            // attach all required modules
            for (; i < len; i++) {
                self._attach(self.Env.mods[requires[i]], fn);
            }

            // load and attach this module
            self._buildPath(mod);
            self._load(mod, fn);

            function fn() {
                if (self._isAttached(requires)) {
                    if (mod.status === LOADED) {
                        self._attachMod(mod);
                    }
                    if (mod.status === ATTACHED) {
                        callback();
                    }
                }
            }
        },

        _attachMod: function(mod) {
            if (mod.fn) mod.fn(this);
            mod.status = ATTACHED;

        },

        _isAttached: function(modNames) {
            var mods = this.Env.mods, mod,
                i = (modNames = S.makeArray(modNames)).length - 1;

            for (; i >= 0 && (mod = mods[modNames[i]]); i--) {
                if (mod.status !== ATTACHED) return false;
            }

            return true;
        },

        /**
         * Load a single module.
         */
        _load: function(mod, callback) {
            var self = this, url = mod.fullpath,
                loadingQueque = self.Env._loadingQueue,
                node;

            if ((mod.status || 0) < LOADING && url) {
                mod.status = LOADING;

                loadingQueque[url] = self.getScript(url, {
                    success: _success,
                    error: function() {
                        mod.status = ERROR;
                        _final();
                    },
                    charset: mod.charset
                });
            }
            // 已经在加载中，需要添加回调到 script onload �?
            // 注意：没有�?�?error 情形
            else if (mod.status === LOADING && (node = loadingQueque[url])) {
                scriptOnload(node, _success);
            }
            // 是内嵌代码，或�?已经 loaded
            else {
                mod.status = LOADED;
                callback();
            }

            function _success() {
                if (mod.status !== ERROR) {

                    mod.status = LOADED;
                    callback();
                }
                _final();
            }
            
            function _final() {
                loadingQueque[url] = undefined;
                delete loadingQueque.url;
            }
        },

        _buildPath: function(mod) {
            if (!mod.fullpath && mod['path']) {
                mod.fullpath = this.Config.base + mod['path'];
            }
            // debug 模式下，加载�?min �?
            if(mod.fullpath && this.Config.debug) {
                mod.fullpath = mod.fullpath.replace(/-min/g, '');
            }
        },

        /**
         * Load a JavaScript file from the server using a GET HTTP request, then execute it.
         * <code>
         *  getScript(url, success, charset);
         *  or
         *  getScript(url, {
         *      charset: string
         *      success: fn,
         *      error: fn,
         *      timeout: number
         *  });
         * </code>
         */
        getScript: function(url, success, charset) {
            var isCSS = RE_CSS.test(url),
                node = doc.createElement(isCSS ? 'link' : 'script'),
                config = success, error, timeout, timer;

            if (S.isPlainObject(config)) {
                success = config.success;
                error = config.error;
                timeout = config.timeout;
                charset = config.charset;
            }

            if (isCSS) {
                node.href = url;
                node.rel = 'stylesheet';
            } else {
                node.src = url;
                node.async = true;
            }
            if (charset) node.charset = charset;

            if (S.isFunction(success)) {
                if (isCSS) {
                    success.call(node);
                } else {
                    scriptOnload(node, function() {
                        if (timer) {
                            timer.cancel();
                            timer = undefined;
                        }
                        success.call(node);
                    });
                }
            }

            if (S.isFunction(error)) {
                timer = S.later(function() {
                    timer = undefined;
                    error();
                }, (timeout || this.Config.timeout) * 1000);
            }

            head.insertBefore(node, head.firstChild);
            return node;
        }
    };

    mix(S, loader);

    S.each(loader, function(v, k) {
        S._APP_MEMBERS.push(k);
    });

})(window, KISSY);

/**
 * TODO:
 *  - combo 实现
 *  - 使用场景和测试用例整�?
 *
 *
 * NOTES:
 *
 * 2010/08/16 玉伯�?
 *  - 基于拔赤的实现，重构。解�?add/use �?ready 的关系，�?��实现代码�?
 *  - 暂时去除 combo 支持，combo 由用户手工控制�?
 *  - 支持 app 生成的多 loader.
 *
 * 2010/08/13 拔赤�?
 *  - 重写 add, use, ready, 重新组织 add 的工作模式，添加 loader 功能�?
 *  - 借鉴 YUI3 原生支持 loader, �?YUI �?loader 使用场景复杂，且�?loader 共存的场�?
 *    在越复杂的程序中越推荐使用，在中等规模的 webpage 中，形同鸡肋，因此将 KISSY 全局对象
 *    包装成一�?loader，来统一管理页面�?���?modules.
 *  - loader 的使用一定要�?add 来配合，加载脚本过程中的三个状�?（before domready,
 *    after domready & before KISSY callbacks' ready, after KISSY callbacks' ready）要明确区分�?
 *  - 使用 add �?ready 的基本�?路和之前保持�?��，即只要执行 add('mod-name', callback)，就
 *    会执行其中的 callback. callback 执行的时机由 loader 统一控制�?
 *  - 支持 combo, 通过 Config.combo = true 来开启，模块�?fullpath �?path 代替�?
 *  - KISSY 内部组件和开发�?文件当做地位平等的模块处理，包括 combo.
 *
 */
/**
 * @module mods
 * @author lifesinger@gmail.com
 */
(function(S) {

    var map = {
        core: {
            path: 'packages/core-min.js',
            charset: 'utf-8'
        }
    };

    S.each(['sizzle', 'datalazyload', 'flash', 'switchable', 'suggest'], function(modName) {
        map[modName] = {
            path: modName + '/' + modName + '-pkg-min.js',
            requires: ['core'],
            charset: 'utf-8'
        };
    });

    S.add(map);

})(KISSY);

/**
 * NOTES:
 *
 *  2010/08/16 �񲮣�
 *   - ����ʵ�������ȣ���ֹ������С���û������Ĳ����㡣
 *
 */