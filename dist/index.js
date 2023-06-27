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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBlestCommand = exports.useBlestRequest = exports.useBlestContext = exports.BlestProvider = void 0;
var react_1 = require("react");
var uuid_1 = require("uuid");
var BlestContext = (0, react_1.createContext)({ queue: [], state: {}, enqueue: function () { } });
var BlestProvider = function (_a) {
    var children = _a.children, url = _a.url, _b = _a.options, options = _b === void 0 ? {} : _b;
    var _c = (0, react_1.useState)([]), queue = _c[0], setQueue = _c[1];
    var _d = (0, react_1.useState)({}), state = _d[0], setState = _d[1];
    var timeout = (0, react_1.useRef)(null);
    var enqueue = (0, react_1.useCallback)(function (id, route, params, selector) {
        if (timeout.current)
            clearTimeout(timeout.current);
        setState(function (state) {
            var _a;
            return __assign(__assign({}, state), (_a = {}, _a[id] = {
                loading: false,
                error: null,
                data: null
            }, _a));
        });
        setQueue(function (queue) { return __spreadArray(__spreadArray([], queue, true), [[id, route, params, selector]], false); });
    }, []);
    (0, react_1.useEffect)(function () {
        if (queue.length > 0) {
            var headers_1 = (options === null || options === void 0 ? void 0 : options.headers) && typeof (options === null || options === void 0 ? void 0 : options.headers) === 'object' ? options.headers : {};
            var myQueue_1 = queue.map(function (q) { return __spreadArray([], q, true); });
            var requestIds_1 = queue.map(function (q) { return q[0]; });
            setQueue([]);
            timeout.current = setTimeout(function () {
                setState(function (state) {
                    var newState = __assign({}, state);
                    for (var i = 0; i < requestIds_1.length; i++) {
                        var id = requestIds_1[i];
                        newState[id] = {
                            loading: true,
                            error: null,
                            data: null
                        };
                    }
                    return newState;
                });
                fetch(url, {
                    body: JSON.stringify(myQueue_1),
                    mode: 'cors',
                    method: 'POST',
                    headers: __assign(__assign({}, headers_1), { "Content-Type": "application/json", "Accept": "application/json" })
                })
                    .then(function (result) { return __awaiter(void 0, void 0, void 0, function () {
                    var results;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, result.json()];
                            case 1:
                                results = _a.sent();
                                setState(function (state) {
                                    var newState = __assign({}, state);
                                    for (var i = 0; i < results.length; i++) {
                                        var item = results[i];
                                        newState[item[0]] = {
                                            loading: false,
                                            error: item[3],
                                            data: item[2]
                                        };
                                    }
                                    return newState;
                                });
                                return [2 /*return*/];
                        }
                    });
                }); })
                    .catch(function (error) {
                    setState(function (state) {
                        var newState = __assign({}, state);
                        for (var i = 0; i < myQueue_1.length; i++) {
                            var id = requestIds_1[i];
                            newState[id] = {
                                loading: false,
                                error: error,
                                data: null
                            };
                        }
                        return newState;
                    });
                });
            }, 1);
        }
    }, [queue, url, options]);
    return (0, react_1.createElement)(BlestContext.Provider, { value: { queue: queue, state: state, enqueue: enqueue } }, children);
};
exports.BlestProvider = BlestProvider;
var useBlestContext = function () {
    var context = (0, react_1.useContext)(BlestContext);
    (0, react_1.useEffect)(function () {
        console.warn('useBlestContext() is a utility function for debugging');
    }, []);
    return context;
};
exports.useBlestContext = useBlestContext;
var useBlestRequest = function (route, parameters, selector) {
    var _a = (0, react_1.useContext)(BlestContext), state = _a.state, enqueue = _a.enqueue;
    var _b = (0, react_1.useState)(null), requestId = _b[0], setRequestId = _b[1];
    var queryState = requestId && state[requestId];
    var lastRequest = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        var requestHash = route + JSON.stringify(parameters || {}) + JSON.stringify(selector || {});
        if (lastRequest.current !== requestHash) {
            lastRequest.current = requestHash;
            var id = (0, uuid_1.v4)();
            setRequestId(id);
            enqueue(id, route, parameters, selector);
        }
    }, [route, parameters, selector, enqueue]);
    return queryState || {};
};
exports.useBlestRequest = useBlestRequest;
var useBlestCommand = function (route, selector) {
    var _a = (0, react_1.useContext)(BlestContext), state = _a.state, enqueue = _a.enqueue;
    var _b = (0, react_1.useState)(null), requestId = _b[0], setRequestId = _b[1];
    var queryState = requestId && state[requestId];
    var request = (0, react_1.useCallback)(function (parameters) {
        var id = (0, uuid_1.v4)();
        setRequestId(id);
        enqueue(id, route, parameters, selector);
    }, [route, selector, enqueue]);
    return [request, queryState || {}];
};
exports.useBlestCommand = useBlestCommand;