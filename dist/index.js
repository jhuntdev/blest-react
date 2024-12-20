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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
exports.useLazyRequest = exports.useRequest = exports.useBlestLazyRequest = exports.useBlestRequest = exports.useBlestContext = exports.withBlest = exports.BlestProvider = void 0;
var react_1 = require("react");
var uuid_1 = require("uuid");
var isEqual_1 = __importDefault(require("lodash/isEqual"));
var EventEmitter = /** @class */ (function () {
    function EventEmitter() {
        this.events = {};
    }
    EventEmitter.prototype.on = function (eventName, handler) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(handler);
    };
    EventEmitter.prototype.off = function (eventName, handler) {
        var eventHandlers = this.events[eventName];
        if (eventHandlers) {
            this.events[eventName] = eventHandlers.filter(function (h) { return h !== handler; });
        }
    };
    EventEmitter.prototype.emit = function (eventName, data) {
        var eventHandlers = this.events[eventName];
        if (eventHandlers) {
            eventHandlers.forEach(function (handler) { return handler(data); });
        }
    };
    return EventEmitter;
}());
var emitter = new EventEmitter();
var BlestContext = (0, react_1.createContext)({ queue: { current: [] }, state: {}, enqueue: function () { }, ammend: function () { } });
exports.BlestProvider = (0, react_1.memo)(function (_a) {
    var children = _a.children, url = _a.url, _b = _a.options, options = _b === void 0 ? {} : _b;
    // const safeOptions = useDeepMemo(options)
    var _c = (0, react_1.useState)({}), state = _c[0], setState = _c[1];
    var queue = (0, react_1.useRef)([]);
    var timeout = (0, react_1.useRef)(null);
    var httpHeaders = useDeepMemo(typeof (options === null || options === void 0 ? void 0 : options.httpHeaders) === 'object' ? options.httpHeaders : {});
    // httpHeaders.current = options?.httpHeaders && typeof options.httpHeaders === 'object' ? options.httpHeaders : {}
    var bufferDelay = (0, react_1.useMemo)(function () { return (options === null || options === void 0 ? void 0 : options.bufferDelay) && typeof options.bufferDelay === 'number' && options.bufferDelay > 0 && Math.round(options.bufferDelay) === options.bufferDelay && options.bufferDelay || 5; }, [options]);
    var maxBatchSize = (0, react_1.useMemo)(function () { return (options === null || options === void 0 ? void 0 : options.maxBatchSize) && typeof options.maxBatchSize === 'number' && options.maxBatchSize > 0 && Math.round(options.maxBatchSize) === options.maxBatchSize && options.maxBatchSize || 25; }, [options]);
    var enqueue = (0, react_1.useCallback)(function (id, route, body, headers) {
        // const bufferDelay = options?.bufferDelay && typeof options.bufferDelay === 'number' && options.bufferDelay > 0 && Math.round(options.bufferDelay) === options.bufferDelay && options.bufferDelay || 5
        setState(function (state) {
            var _a;
            return __assign(__assign({}, state), (_a = {}, _a[id] = {
                loading: true,
                error: null,
                data: null
            }, _a));
        });
        queue.current = __spreadArray(__spreadArray([], queue.current, true), [[id, route, body, headers]], false);
        if (!timeout.current) {
            timeout.current = setTimeout(process, bufferDelay);
        }
    }, [httpHeaders, maxBatchSize, bufferDelay]);
    var ammend = (0, react_1.useCallback)(function (id, data) {
        setState(function (state) {
            var _a;
            var newState = __assign(__assign({}, state), (_a = {}, _a[id] = __assign(__assign({}, state[id]), { data: data }), _a));
            return newState;
        });
    }, [httpHeaders, maxBatchSize, bufferDelay]);
    var process = (0, react_1.useCallback)(function () {
        if (timeout.current) {
            clearTimeout(timeout.current);
            timeout.current = null;
        }
        if (!queue.current.length) {
            return;
        }
        // const maxBatchSize = options?.maxBatchSize && typeof options.maxBatchSize === 'number' && options.maxBatchSize > 0 && Math.round(options.maxBatchSize) === options.maxBatchSize && options.maxBatchSize || 25
        // const headers = options?.headers && typeof options.headers === 'object' ? options.headers : {}
        var copyQueue = __spreadArray([], queue.current, true); // .map((q: BlestQueueItem) => [...q])
        queue.current = [];
        var batchCount = Math.ceil(copyQueue.length / maxBatchSize);
        var _loop_1 = function (i) {
            var myQueue = copyQueue.slice(i * maxBatchSize, (i + 1) * maxBatchSize);
            var requestIds = myQueue.map(function (q) { return q[0]; });
            fetch(url, {
                body: JSON.stringify(myQueue),
                mode: 'cors',
                method: 'POST',
                headers: __assign(__assign({}, httpHeaders), { "Content-Type": "application/json", "Accept": "application/json" })
            })
                .then(function (response) { return __awaiter(void 0, void 0, void 0, function () {
                var results, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, response.json()];
                        case 1:
                            results = _a.sent();
                            if (response.ok) {
                                setState(function (state) {
                                    var newState = __assign({}, state);
                                    for (var i_1 = 0; i_1 < results.length; i_1++) {
                                        var item = results[i_1];
                                        emitter.emit(item[0], { data: item[2], error: item[3] });
                                        newState[item[0]] = {
                                            loading: false,
                                            error: item[3],
                                            data: item[2]
                                        };
                                    }
                                    return newState;
                                });
                            }
                            else {
                                error_1 = results || { status: response.status, message: response.statusText || 'Network error' };
                                setState(function (state) {
                                    var newState = __assign({}, state);
                                    for (var i_2 = 0; i_2 < requestIds.length; i_2++) {
                                        var id = requestIds[i_2];
                                        emitter.emit(id, { data: null, error: error_1 });
                                        newState[id] = {
                                            loading: false,
                                            error: error_1,
                                            data: null
                                        };
                                    }
                                    return newState;
                                });
                            }
                            return [2 /*return*/];
                    }
                });
            }); })
                .catch(function (error) {
                setState(function (state) {
                    var newState = __assign({}, state);
                    for (var i_3 = 0; i_3 < requestIds.length; i_3++) {
                        var id = requestIds[i_3];
                        emitter.emit(id, { data: null, error: error });
                        newState[id] = {
                            loading: false,
                            error: error,
                            data: null
                        };
                    }
                    return newState;
                });
            });
        };
        for (var i = 0; i < batchCount; i++) {
            _loop_1(i);
        }
    }, [httpHeaders, maxBatchSize, bufferDelay]);
    return (0, react_1.createElement)(BlestContext.Provider, { value: { queue: queue, state: state, enqueue: enqueue, ammend: ammend } }, children);
}, function (oldProps, newProps) {
    return oldProps.url === newProps.url && (0, isEqual_1.default)(oldProps.options, newProps.options) && (0, isEqual_1.default)(oldProps.children, newProps.children);
});
var withBlest = function (Component, url, options) {
    return function (props) { return (0, react_1.createElement)(exports.BlestProvider, { url: url, options: options, children: (0, react_1.createElement)(Component, props) }); };
};
exports.withBlest = withBlest;
var useBlestContext = function () {
    var context = (0, react_1.useContext)(BlestContext);
    (0, react_1.useEffect)(function () {
        console.warn('useBlestContext() is a utility function for debugging');
    }, []);
    return context;
};
exports.useBlestContext = useBlestContext;
var useBlestRequest = function (route, body, headers, options) {
    var safeBody = useDeepMemo(body);
    var safeHeaders = useDeepMemo(headers);
    var safeOptions = useDeepMemo(options);
    var _a = (0, react_1.useContext)(BlestContext), state = _a.state, enqueue = _a.enqueue, ammend = _a.ammend;
    var _b = (0, react_1.useState)(null), requestId = _b[0], setRequestId = _b[1];
    var requestState = useDeepMemo(requestId && state[requestId]);
    // useMemo(() => requestId && state[requestId], [requestId && JSON.stringify(state[requestId])])
    var lastRequest = (0, react_1.useRef)(null);
    var allRequestIds = (0, react_1.useRef)([]);
    var doneRequestIds = (0, react_1.useRef)([]);
    var callbacksById = (0, react_1.useRef)({});
    (0, react_1.useEffect)(function () {
        if (safeOptions === null || safeOptions === void 0 ? void 0 : safeOptions.skip)
            return;
        var requestHash = route + JSON.stringify(safeBody || {}) + JSON.stringify(safeHeaders || {}) + JSON.stringify(safeOptions || {});
        if (lastRequest.current !== requestHash) {
            lastRequest.current = requestHash;
            var id = (0, uuid_1.v1)();
            setRequestId(id);
            allRequestIds.current = __spreadArray(__spreadArray([], allRequestIds.current, true), [id], false);
            enqueue(id, route, safeBody, safeHeaders);
        }
    }, [route, safeBody, safeHeaders, safeOptions]);
    var fetchMore = function (body, mergeFunction) {
        return new Promise(function (resolve, reject) {
            var _a;
            if ((safeOptions && safeOptions.skip) ||
                !requestId ||
                doneRequestIds.current.indexOf(requestId) === -1)
                return resolve(null);
            var id = (0, uuid_1.v1)();
            allRequestIds.current = __spreadArray(__spreadArray([], allRequestIds.current, true), [id], false);
            callbacksById.current = __assign(__assign({}, callbacksById.current), (_a = {}, _a[id] = mergeFunction, _a));
            enqueue(id, route, body, safeHeaders);
            emitter.on(id, function (_a) {
                var data = _a.data, error = _a.error;
                if (error) {
                    reject(error);
                }
                else if (data) {
                    resolve(data);
                }
            });
        });
    };
    var refresh = function () {
        return new Promise(function (resolve, reject) {
            if ((safeOptions && safeOptions.skip) ||
                !requestId ||
                doneRequestIds.current.indexOf(requestId) === -1)
                return resolve(null);
            var id = (0, uuid_1.v1)();
            setRequestId(id);
            enqueue(id, route, safeBody, safeHeaders);
            emitter.on(id, function (_a) {
                var data = _a.data, error = _a.error;
                if (error) {
                    reject(error);
                }
                else {
                    resolve(data);
                }
            });
        });
    };
    (0, react_1.useEffect)(function () {
        var _a;
        if (!requestId)
            return;
        for (var i = 0; i < allRequestIds.current.length; i++) {
            var id = allRequestIds.current[i];
            if (state[id] && (state[id].data || state[id].error) && doneRequestIds.current.indexOf(id) === -1) {
                doneRequestIds.current = __spreadArray(__spreadArray([], doneRequestIds.current, true), [id], false);
                if (state[id].data && typeof callbacksById.current[id] === 'function') {
                    ammend(requestId, callbacksById.current[id](requestId ? ((_a = state[requestId]) === null || _a === void 0 ? void 0 : _a.data) || {} : {}, state[id].data));
                }
            }
        }
    }, [requestState, requestId]);
    return __assign(__assign({}, (requestState || { loading: true, error: null, data: null })), { fetchMore: fetchMore, refresh: refresh });
};
exports.useBlestRequest = useBlestRequest;
var useBlestLazyRequest = function (route, headers, options) {
    var safeHeaders = useDeepMemo(headers);
    var safeOptions = useDeepMemo(options);
    var _a = (0, react_1.useContext)(BlestContext), state = _a.state, enqueue = _a.enqueue;
    var _b = (0, react_1.useState)(null), requestId = _b[0], setRequestId = _b[1];
    var requestState = useDeepMemo(requestId && state[requestId]);
    // useMemo(() => requestId && state[requestId], [requestId && state[requestId]])
    var allRequestIds = (0, react_1.useRef)([]);
    var doneRequestIds = (0, react_1.useRef)([]);
    var request = (0, react_1.useCallback)(function (body) {
        return new Promise(function (resolve, reject) {
            if (safeOptions === null || safeOptions === void 0 ? void 0 : safeOptions.skip)
                return reject();
            var id = (0, uuid_1.v1)();
            setRequestId(id);
            allRequestIds.current = __spreadArray(__spreadArray([], allRequestIds.current, true), [id], false);
            enqueue(id, route, body, safeHeaders);
            emitter.on(id, function (_a) {
                var data = _a.data, error = _a.error;
                if (error) {
                    reject(error);
                }
                else {
                    resolve(data);
                }
            });
        });
    }, [enqueue, route, safeHeaders, safeOptions]);
    (0, react_1.useEffect)(function () {
        for (var i = 0; i < allRequestIds.current.length; i++) {
            var id = allRequestIds.current[i];
            if (state[id] && (state[id].data || state[id].error) && doneRequestIds.current.indexOf(id) === -1) {
                doneRequestIds.current = __spreadArray(__spreadArray([], doneRequestIds.current, true), [id], false);
                if (safeOptions && safeOptions.onComplete && typeof safeOptions.onComplete === 'function') {
                    safeOptions.onComplete(state[id].data, state[id].error);
                }
            }
        }
    }, [requestState, safeOptions]);
    return [request, requestState || { loading: false, error: null, data: null }];
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
