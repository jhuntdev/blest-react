"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLazyRequest = exports.useRequest = exports.useBlestLazyRequest = exports.useBlestRequest = exports.BlestProvider = exports.EventEmitter = void 0;
var react_1 = require("react");
var isEqual_1 = __importDefault(require("lodash/isEqual"));
var idGenerator = function (length) {
    if (length === void 0) { length = 8; }
    var max = Math.pow(16, length) - 1;
    var randomNumber = Math.floor(Math.random() * (max + 1));
    var id = randomNumber.toString(16).padStart(length, '0');
    return id;
};
var EventEmitter = /** @class */ (function () {
    function EventEmitter() {
        this.runByEvent = {};
    }
    EventEmitter.prototype.add = function (event, cb, once) {
        if (once === void 0) { once = false; }
        if (!this.runByEvent[event])
            this.runByEvent[event] = [];
        var node = {
            id: idGenerator(),
            event: event,
            cb: cb,
            once: once
        };
        this.runByEvent[event].push(node);
    };
    EventEmitter.prototype.remove = function (node) {
        this.runByEvent[node.event] = this.runByEvent[node.event].filter(function (n) { return n.id !== node.id; });
    };
    EventEmitter.prototype.on = function (event, cb, once) {
        var _this = this;
        if (once === void 0) { once = false; }
        if (typeof cb != 'function')
            throw TypeError("Callback parameter has to be a function.");
        var node = this.add(event, cb, once);
        return function () { return _this.remove(node); };
    };
    EventEmitter.prototype.once = function (event, cb) {
        return this.on(event, cb, true);
    };
    EventEmitter.prototype.emit = function (event) {
        var data = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            data[_i - 1] = arguments[_i];
        }
        var nodes = this.runByEvent[event];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            node.cb.apply(node, data);
            if (node.once) {
                this.remove(node);
            }
        }
    };
    return EventEmitter;
}());
exports.EventEmitter = EventEmitter;
var BlestContext = (0, react_1.createContext)({ client: null });
var BlestProvider = function (_a) {
    var children = _a.children, url = _a.url, _b = _a.options, options = _b === void 0 ? {} : _b;
    var safeOptions = useDeepMemo(options || {});
    var _c = (0, react_1.useState)(null), client = _c[0], setClient = _c[1];
    (0, react_1.useEffect)(function () {
        setClient(new HttpClient(url, safeOptions));
    }, []);
    (0, react_1.useEffect)(function () {
        client === null || client === void 0 ? void 0 : client.setOptions(safeOptions);
    }, [safeOptions]);
    (0, react_1.useEffect)(function () {
        client === null || client === void 0 ? void 0 : client.setUrl(url);
    }, [url]);
    return client ? (0, react_1.createElement)(BlestContext.Provider, { value: { client: client } }, children) : (0, react_1.createElement)(react_1.Fragment);
};
exports.BlestProvider = BlestProvider;
var HttpClient = /** @class */ (function () {
    function HttpClient(url, options) {
        this.url = '';
        this.httpHeaders = {};
        this.maxBatchSize = 25;
        this.bufferDelay = 10;
        this.queue = [];
        this.timeout = null;
        this.emitter = new EventEmitter();
        this.idGenerator = idGenerator;
        this.url = url;
        this.setOptions(options);
    }
    HttpClient.prototype.setOptions = function (options) {
        if (!options) {
            return false;
        }
        else if (typeof options !== 'object') {
            throw new Error('Options should be an object');
        }
        else {
            if (options.httpHeaders) {
                if (typeof options.httpHeaders !== 'object' || Array.isArray(options.httpHeaders)) {
                    throw new Error('"httpHeaders" option should be an object');
                }
                this.httpHeaders = options.httpHeaders;
            }
            if (options.maxBatchSize) {
                if (typeof options.maxBatchSize !== 'number' || Math.round(options.maxBatchSize) !== options.maxBatchSize) {
                    throw new Error('"maxBatchSize" option should be an integer');
                }
                else if (options.maxBatchSize < 1) {
                    throw new Error('"maxBatchSize" option should be greater than or equal to one');
                }
                this.maxBatchSize = options.maxBatchSize;
            }
            if (options.bufferDelay) {
                if (typeof options.bufferDelay !== 'number' || Math.round(options.bufferDelay) !== options.bufferDelay) {
                    throw new Error('"bufferDelay" option should be an integer');
                }
                else if (options.bufferDelay < 0) {
                    throw new Error('"bufferDelay" option should be greater than or equal to zero');
                }
                this.bufferDelay = options.bufferDelay;
            }
        }
        return false;
    };
    HttpClient.prototype.setUrl = function (url) {
        if (url && typeof url === 'string') {
            this.url = url;
        }
    };
    HttpClient.prototype.process = function () {
        var _this = this;
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
        if (!this.queue.length) {
            return;
        }
        var copyQueue = this.queue.map(function (q) { return __spreadArray([], q, true); });
        this.queue = [];
        var batchCount = Math.ceil(copyQueue.length / this.maxBatchSize);
        var _loop_1 = function (i) {
            var myQueue = copyQueue.slice(i * this_1.maxBatchSize, (i + 1) * this_1.maxBatchSize);
            httpPostRequest(this_1.url, myQueue, this_1.httpHeaders)
                .then(function (data) { return __awaiter(_this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    data.forEach(function (r) {
                        _this.emitter.emit(r[0], r[2], r[3]);
                    });
                    return [2 /*return*/];
                });
            }); })
                .catch(function (error) {
                myQueue.forEach(function (q) {
                    _this.emitter.emit(q[0], null, error);
                });
            });
        };
        var this_1 = this;
        for (var i = 0; i < batchCount; i++) {
            _loop_1(i);
        }
    };
    HttpClient.prototype.set = function (option, value) {
        var _a;
        if (typeof option !== 'string')
            throw new Error('Option name must be a string');
        this.setOptions((_a = {}, _a[option] = value, _a));
    };
    HttpClient.prototype.request = function (route, body, headers) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!route) {
                return reject(new Error('Route is required'));
            }
            else if (body && typeof body !== 'object') {
                return reject(new Error('Body should be an object'));
            }
            else if (headers && typeof headers !== 'object') {
                return reject(new Error('Headers should be an object'));
            }
            var id = _this.idGenerator();
            _this.emitter.once(id, function (result, error) {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            });
            _this.queue.push([id, route, body || null, headers || null]);
            if (!_this.timeout) {
                _this.timeout = setTimeout(function () { _this.process(); }, _this.bufferDelay);
            }
        });
    };
    return HttpClient;
}());
;
var httpPostRequest = function (url_1, data_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([url_1, data_1], args_1, true), void 0, function (url, data, httpHeaders) {
        var requestData, options, response;
        if (httpHeaders === void 0) { httpHeaders = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    requestData = JSON.stringify(data);
                    options = {
                        method: 'POST',
                        body: requestData,
                        mode: 'cors',
                        headers: __assign(__assign({}, httpHeaders), { 'Accept': 'application/json', 'Content-Type': 'application/json' })
                    };
                    return [4 /*yield*/, fetch(url, options)];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error("HTTP POST request failed with status code ".concat(response.status));
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
};
var makeBlestHeaders = function (options) {
    var headers = {};
    if (!options)
        return headers;
    if (options.select && Array.isArray(options.select)) {
        headers._s = options.select;
    }
    return headers;
};
var useBlestRequest = function (route, body, options) {
    var safeBody = useDeepMemo(body);
    var safeOptions = useDeepMemo(options);
    var client = (0, react_1.useContext)(BlestContext).client;
    var _a = (0, react_1.useState)(!(options === null || options === void 0 ? void 0 : options.skip)), loading = _a[0], setLoading = _a[1];
    var _b = (0, react_1.useState)(null), error = _b[0], setError = _b[1];
    var _c = (0, react_1.useState)(null), data = _c[0], setData = _c[1];
    var lastRequest = (0, react_1.useRef)('');
    var doRequest = function (client, route, body, headers) {
        setLoading(true);
        return client.request(route, body, headers)
            .then(function (data) {
            setError(null);
            setData(data);
            return Promise.resolve(data);
        })
            .catch(function (error) {
            setData(null);
            setError(error);
        })
            .finally(function () {
            setLoading(false);
        });
    };
    (0, react_1.useEffect)(function () {
        if (safeOptions === null || safeOptions === void 0 ? void 0 : safeOptions.skip)
            return;
        var requestHash = route + JSON.stringify(safeBody);
        if (!lastRequest.current || lastRequest.current !== requestHash) {
            lastRequest.current = requestHash;
            if (!client)
                throw new Error('Missing BLEST client in context');
            var headers = makeBlestHeaders(safeOptions);
            doRequest(client, route, safeBody, headers);
        }
    }, [client, route, safeBody, safeOptions]);
    var refresh = (0, react_1.useCallback)(function () {
        if (!client)
            throw new Error('Missing BLEST client in context');
        var headers = makeBlestHeaders(safeOptions);
        return doRequest(client, route, safeBody, headers);
    }, [client, route, safeBody, safeOptions]);
    return {
        loading: loading,
        error: error,
        data: data,
        refresh: refresh
    };
};
exports.useBlestRequest = useBlestRequest;
var useBlestLazyRequest = function (route, options) {
    var safeOptions = useDeepMemo(options);
    var client = (0, react_1.useContext)(BlestContext).client;
    var _a = (0, react_1.useState)(false), loading = _a[0], setLoading = _a[1];
    var _b = (0, react_1.useState)(null), error = _b[0], setError = _b[1];
    var _c = (0, react_1.useState)(null), data = _c[0], setData = _c[1];
    var doRequest = function (client, route, body, headers) {
        setLoading(true);
        return client.request(route, body, headers)
            .then(function (data) {
            setError(null);
            setData(data);
            return Promise.resolve(data);
        })
            .catch(function (error) {
            setData(null);
            setError(error);
        })
            .finally(function () {
            setLoading(false);
        });
    };
    var request = (0, react_1.useCallback)(function (body) {
        if (!client)
            throw new Error('Missing BLEST client in context');
        var headers = makeBlestHeaders(safeOptions);
        return doRequest(client, route, body, headers);
    }, [client, route]);
    return [request, { loading: loading, error: error, data: data }];
};
exports.useBlestLazyRequest = useBlestLazyRequest;
exports.useRequest = exports.useBlestRequest;
exports.useLazyRequest = exports.useBlestLazyRequest;
var useDeepMemo = function (value) {
    var _a = (0, react_1.useState)(), safeValue = _a[0], setSafeValue = _a[1];
    if (!(0, isEqual_1.default)(value, safeValue)) {
        setSafeValue(value);
    }
    return safeValue;
};
