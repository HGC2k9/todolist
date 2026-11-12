var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// node_modules/unenv/dist/runtime/_internal/utils.mjs
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
__name(PerformanceEntry, "PerformanceEntry");
var PerformanceMark = /* @__PURE__ */ __name(class PerformanceMark2 extends PerformanceEntry {
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
}, "PerformanceMark");
var PerformanceMeasure = class extends PerformanceEntry {
  entryType = "measure";
};
__name(PerformanceMeasure, "PerformanceMeasure");
var PerformanceResourceTiming = class extends PerformanceEntry {
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
__name(PerformanceResourceTiming, "PerformanceResourceTiming");
var PerformanceObserverEntryList = class {
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
__name(PerformanceObserverEntryList, "PerformanceObserverEntryList");
var Performance = class {
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
__name(Performance, "Performance");
var PerformanceObserver = class {
  __unenv__ = true;
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
__name(PerformanceObserver, "PerformanceObserver");
__publicField(PerformanceObserver, "supportedEntryTypes", []);
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
import { Socket } from "node:net";
var ReadStream = class extends Socket {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  isRaw = false;
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
  isTTY = false;
};
__name(ReadStream, "ReadStream");

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
import { Socket as Socket2 } from "node:net";
var WriteStream = class extends Socket2 {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  columns = 80;
  rows = 24;
  isTTY = false;
};
__name(WriteStream, "WriteStream");

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class extends EventEmitter {
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return "";
  }
  get versions() {
    return {};
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  ref() {
  }
  unref() {
  }
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: () => 0 });
  mainModule = void 0;
  domain = void 0;
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};
__name(Process, "Process");

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var { exit, platform, nextTick } = getBuiltinModule(
  "node:process"
);
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  nextTick
});
var {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  finalization,
  features,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  on,
  off,
  once,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// node_modules/hono/dist/http-exception.js
var HTTPException = /* @__PURE__ */ __name(class extends Error {
  res;
  status;
  /**
  * Creates an instance of `HTTPException`.
  * @param status - HTTP status code for the exception. Defaults to 500.
  * @param options - Additional options for the exception.
  */
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  /**
  * Returns the response object associated with the exception.
  * If a response object is not provided, a new response is created with the error message and status code.
  * @returns The response object.
  */
  getResponse() {
    if (this.res)
      return new Response(this.res.body, {
        status: this.status,
        headers: this.res.headers
      });
    return new Response(this.message, { status: this.status });
  }
}, "HTTPException");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  return new Response(arrayBuffer, { headers: { "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase()) } }).formData();
}, "bufferToFormData");

// node_modules/hono/dist/utils/body.js
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const mediaType = (isRawRequest(request) ? request.headers : request.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded")
    return parseFormData(request, {
      all,
      dot
    });
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData)
    return convertFormDataToBodyData(await request.bodyCache.formData, options);
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request))
    request.bodyCache.formData = formDataPromise;
  const formData = await formDataPromise;
  if (formData)
    return convertFormDataToBodyData(formData, options);
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    if (!(options.all || key.endsWith("[]")))
      form[key] = value;
    else
      handleParsingAllValues(form, key, value);
  });
  if (options.dot)
    Object.entries(form).forEach(([key, value]) => {
      if (key.includes(".")) {
        handleParsingNestedValues(form, key, value, nestingState);
        delete form[key];
      }
    });
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key]))
      form[key].push(value);
    else
      form[key] = [form[key], value];
  } else if (!key.endsWith("[]"))
    form[key] = value;
  else
    form[key] = [value];
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key))
    return;
  let nestedForm = form;
  const keys = key.split(".", 34);
  if (keys.length > 33)
    throwNestingLimitExceeded();
  keys.forEach((key2, index) => {
    if (index === keys.length - 1)
      nestedForm[key2] = value;
    else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS)
          throwNestingLimitExceeded();
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");
var throwNestingLimitExceeded = /* @__PURE__ */ __name(() => {
  throw new Error("Nesting limit exceeded");
}, "throwNestingLimitExceeded");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "")
    paths.shift();
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath2) => {
  const { groups, path } = extractGroupsFromPath(routePath2);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return {
    groups,
    path
  };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--)
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*")
    return "*";
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2])
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [
          cacheKey,
          match2[1],
          new RegExp(`^${match2[2]}(?=/${next})`)
        ] : [
          label,
          match2[1],
          new RegExp(`^${match2[2]}$`)
        ];
      else
        patternCache[cacheKey] = [
          label,
          match2[1],
          true
        ];
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var decodeURIWithPreservedPercent = /* @__PURE__ */ __name((value) => decodeURI(value.includes("%25") ? value.replace(/%25/g, "%2525") : value), "decodeURIWithPreservedPercent");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      const decoded = tryDecode(path, decodeURIWithPreservedPercent);
      if (/%(?![0-9A-Fa-f]{2})/.test(path)) {
        const rewritten = new URL("http://localhost");
        rewritten.pathname = decoded.replace(/[\\\t\n\r]/g, encodeURIComponent);
        if (tryDecode(rewritten.pathname, decodeURIWithPreservedPercent) !== decoded)
          return tryDecode(path.replace(/%(?![0-9A-Fa-f]{2})/g, "%25"), decodeURIWithPreservedPercent);
      }
      return decoded;
    } else if (charCode === 63 || charCode === 35)
      break;
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length)
    sub = mergePath(sub, ...rest);
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":"))
    return null;
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment))
      basePath += "/" + segment;
    else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "")
          results.push("/");
        else
          results.push(basePath);
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else
        basePath += "/" + segment;
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str, "tryDecodeURIComponent");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (value.indexOf("+") !== -1)
    value = value.replace(/\+/g, " ");
  return tryDecodeURIComponent(value);
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1)
    url = url.slice(0, hashIndex);
  let encoded;
  if (!multiple && key && !/[%+&=]/.test(key)) {
    const queryIndex = url.indexOf("?", 8);
    let keyIndex2 = queryIndex;
    if (keyIndex2 === -1)
      return;
    if (!url.startsWith(key, keyIndex2 + 1))
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61 || trailingKeyCode === 38 || isNaN(trailingKeyCode)) {
        if (keyIndex2 > queryIndex && /(?:^|&)[^=&]*[%+]/.test(url.slice(queryIndex + 1, keyIndex2)))
          break;
        if (trailingKeyCode === 61) {
          const valueIndex = keyIndex2 + key.length + 2;
          const endIndex = url.indexOf("&", valueIndex);
          return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
        }
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded)
      return;
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1)
      valueIndex = -1;
    let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
    if (encoded)
      name = _decodeURI(name);
    keyIndex = nextKeyIndex;
    if (name === "")
      continue;
    let value;
    if (valueIndex === -1)
      value = "";
    else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded)
        value = _decodeURI(value);
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name])))
        results[name] = [];
      results[name].push(value);
    } else
      results[name] ??= value;
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = /* @__PURE__ */ __name(class {
  /**
  * `.raw` can get the raw Request object.
  *
  * @see {@link https://hono.dev/docs/api/request#raw}
  *
  * @example
  * ```ts
  * // For Cloudflare Workers
  * app.post('/', async (c) => {
  *   const metadata = c.req.raw.cf?.hostMetadata?
  *   ...
  * })
  * ```
  */
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  /**
  * `.path` can get the pathname of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#path}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const pathname = c.req.path // `/about/me`
  * })
  * ```
  */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0)
        decoded[key] = tryDecodeURIComponent(value);
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name)
      return this.raw.headers.get(name) ?? void 0;
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody)
      return cachedBody;
    for (const anyCachedKey in bodyCache)
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json")
          body = JSON.stringify(body);
        const contentType = anyCachedKey === "formData" ? void 0 : raw2.headers.get("content-type");
        return new Response(body, { headers: contentType ? { "Content-Type": contentType } : void 0 })[key]();
      });
    return bodyCache[key] = raw2[key]();
  };
  /**
  * `.json()` can parse Request body of type `application/json`
  *
  * @see {@link https://hono.dev/docs/api/request#json}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.json()
  * })
  * ```
  */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
  * `.text()` can parse Request body of type `text/plain`
  *
  * @see {@link https://hono.dev/docs/api/request#text}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.text()
  * })
  * ```
  */
  text() {
    return this.#cachedBody("text");
  }
  /**
  * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
  *
  * @see {@link https://hono.dev/docs/api/request#arraybuffer}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.arrayBuffer()
  * })
  * ```
  */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
  * `.bytes()` parses the request body as a `Uint8Array`.
  *
  * @see {@link https://hono.dev/docs/api/request#bytes}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.bytes()
  * })
  * ```
  */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
  * Parses the request body as a `Blob`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.blob();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#blob
  */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
  * Parses the request body as `FormData`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.formData();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#formdata
  */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
  * Adds validated data to the request.
  *
  * @param target - The target of the validation.
  * @param data - The validated data to add.
  */
  addValidatedData(target, data) {
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
  * `.url` can get the request url strings.
  *
  * @see {@link https://hono.dev/docs/api/request#url}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const url = c.req.url // `http://localhost:8787/about/me`
  *   ...
  * })
  * ```
  */
  get url() {
    return this.raw.url;
  }
  /**
  * `.method` can get the method name of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#method}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const method = c.req.method // `GET`
  * })
  * ```
  */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
  * `.matchedRoutes` can return a matched route in the handler
  *
  * @deprecated
  *
  * Use matchedRoutes helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#matchedroutes}
  *
  * @example
  * ```ts
  * app.use('*', async function logger(c, next) {
  *   await next()
  *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
  *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
  *     console.log(
  *       method,
  *       ' ',
  *       path,
  *       ' '.repeat(Math.max(10 - path.length, 0)),
  *       name,
  *       i === c.req.routeIndex ? '<- respond from here' : ''
  *     )
  *   })
  * })
  * ```
  */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
  * `.routePath` can retrieve the path registered within the handler
  *
  * @deprecated
  *
  * Use routePath helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#routepath}
  *
  * @example
  * ```ts
  * app.get('/posts/:id', (c) => {
  *   return c.json({ path: c.req.routePath })
  * })
  * ```
  */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
}, "HonoRequest");

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context2, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise))
      str = str.toString();
    if (str instanceof Promise)
      str = await str;
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length)
    return Promise.resolve(str);
  if (buffer)
    buffer[0] += str;
  else
    buffer = [str];
  const resStr = Promise.all(callbacks.map((c) => c({
    phase,
    buffer,
    context: context2
  }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context2, buffer))).then(() => buffer[0]));
  if (preserveCallbacks)
    return raw(await resStr, callbacks);
  else
    return resStr;
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = /* @__PURE__ */ __name(class {
  #rawRequest;
  #req;
  /**
  * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
  *
  * @see {@link https://hono.dev/docs/api/context#env}
  *
  * @example
  * ```ts
  * // Environment object for Cloudflare Workers
  * app.get('*', async c => {
  *   const counter = c.env.COUNTER
  * })
  * ```
  */
  env = {};
  #var;
  finalized = false;
  /**
  * `.error` can get the error object from the middleware if the Handler throws an error.
  *
  * @see {@link https://hono.dev/docs/api/context#error}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   await next()
  *   if (c.error) {
  *     // do something...
  *   }
  * })
  * ```
  */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
  * Creates an instance of the Context class.
  *
  * @param req - The Request object.
  * @param options - Optional configuration options for the context.
  */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
  * `.req` is the instance of {@link HonoRequest}.
  */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#event}
  * The FetchEvent associated with the current request.
  *
  * @throws Will throw an error if the context does not have a FetchEvent.
  */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx)
      return this.#executionCtx;
    else
      throw Error("This context has no FetchEvent");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#executionctx}
  * The ExecutionContext associated with the current request.
  *
  * @throws Will throw an error if the context does not have an ExecutionContext.
  */
  get executionCtx() {
    if (this.#executionCtx)
      return this.#executionCtx;
    else
      throw Error("This context has no ExecutionContext");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#res}
  * The Response object for the current request.
  */
  get res() {
    return this.#res ||= createResponseInstance(null, { headers: this.#preparedHeaders ??= new Headers() });
  }
  /**
  * Sets the Response object for the current request.
  *
  * @param _res - The Response object to set.
  */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type")
          continue;
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies)
            _res.headers.append("set-cookie", cookie);
        } else
          _res.headers.set(k, v);
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
  * `.render()` can create a response within a layout.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   return c.render('Hello!')
  * })
  * ```
  */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
  * Sets the layout for the response.
  *
  * @param layout - The layout to set.
  * @returns The layout function.
  */
  setLayout = (layout) => this.#layout = layout;
  /**
  * Gets the current layout for the response.
  *
  * @returns The current layout function.
  */
  getLayout = () => this.#layout;
  /**
  * `.setRenderer()` can set the layout in the custom middleware.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```tsx
  * app.use('*', async (c, next) => {
  *   c.setRenderer((content) => {
  *     return c.html(
  *       <html>
  *         <body>
  *           <p>{content}</p>
  *         </body>
  *       </html>
  *     )
  *   })
  *   await next()
  * })
  * ```
  */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
  * `.header()` can set headers.
  *
  * @see {@link https://hono.dev/docs/api/context#header}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *
  *   // Append multiple headers using the append option (e.g. Vary)
  *   c.header('Vary', 'Accept-Encoding', { append: true })
  *   c.header('Vary', 'User-Agent', { append: true })
  *
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  header = (name, value, options) => {
    if (this.finalized && !this.#res.bodyUsed)
      this.#res = createResponseInstance(this.#res.body, this.#res);
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0)
      headers.delete(name);
    else if (options?.append)
      headers.append(name, value);
    else
      headers.set(name, value);
  };
  status = (status) => {
    this.#status = status;
  };
  /**
  * `.set()` can set the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   c.set('message', 'Hono is hot!!')
  *   await next()
  * })
  * ```
  */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
  * `.get()` can use the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   const message = c.get('message')
  *   return c.text(`The message is "${message}"`)
  * })
  * ```
  */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
  * `.var` can access the value of a variable.
  *
  * @see {@link https://hono.dev/docs/api/context#var}
  *
  * @example
  * ```ts
  * const result = c.var.client.oneMethod()
  * ```
  */
  get var() {
    if (!this.#var)
      return {};
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers))
        if (key === "set-cookie")
          responseHeaders.append(key, value);
        else
          responseHeaders.set(key, value);
    }
    if (headers) {
      if (!responseHeaders) {
        let count3 = 0;
        for (const k in headers)
          if (++count3 > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers();
            break;
          }
      }
      if (responseHeaders)
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string")
            responseHeaders.set(k, v);
          else {
            responseHeaders.delete(k);
            for (const v2 of v)
              responseHeaders.append(k, v2);
          }
        }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
  * `.body()` can return the HTTP response.
  * You can set headers with `.header()` and set HTTP status code with `.status`.
  * This can also be set in `.text()`, `.json()` and so on.
  *
  * @see {@link https://hono.dev/docs/api/context#body}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *   // Set HTTP status code
  *   c.status(201)
  *
  *   // Return the response body
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
  * `.text()` can render text as `Content-Type:text/plain`.
  *
  * @see {@link https://hono.dev/docs/api/context#text}
  *
  * @example
  * ```ts
  * app.get('/say', (c) => {
  *   return c.text('Hello!')
  * })
  * ```
  */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(text, arg, setDefaultContentType(TEXT_PLAIN, headers));
  };
  /**
  * `.json()` can render JSON as `Content-Type:application/json`.
  *
  * @see {@link https://hono.dev/docs/api/context#json}
  *
  * @example
  * ```ts
  * app.get('/api', (c) => {
  *   return c.json({ message: 'Hello!' })
  * })
  * ```
  */
  json = (object, arg, headers) => {
    return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
  };
  html = (html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
  * `.redirect()` can Redirect, default status code is 302.
  *
  * @see {@link https://hono.dev/docs/api/context#redirect}
  *
  * @example
  * ```ts
  * app.get('/redirect', (c) => {
  *   return c.redirect('/')
  * })
  * app.get('/redirect-permanently', (c) => {
  *   return c.redirect('/', 301)
  * })
  * ```
  */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header("Location", !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString));
    return this.newResponse(null, status ?? 302);
  };
  /**
  * `.notFound()` can return the Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/context#notfound}
  *
  * @example
  * ```ts
  * app.get('/notfound', (c) => {
  *   return c.notFound()
  * })
  * ```
  */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
}, "Context");

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context2, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index)
        throw new Error("next() called multiple times");
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context2.req.routeIndex = i;
      } else
        handler = i === middleware.length && next || void 0;
      if (handler)
        try {
          res = await handler(context2, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context2.error = err;
            res = await onError(err, context2);
            isError = true;
          } else
            throw err;
        }
      else if (context2.finalized === false && onNotFound)
        res = await onNotFound(context2);
      if (res && (context2.finalized === false || isError))
        context2.res = res;
      return context2;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/helper/route/index.js
var matchedRoutes = /* @__PURE__ */ __name((c) => c.req[GET_MATCH_RESULT][0].map(([[, route]]) => route), "matchedRoutes");
var routePath = /* @__PURE__ */ __name((c, index) => matchedRoutes(c).at(index ?? c.req.routeIndex)?.path ?? "", "routePath");

// node_modules/hono/dist/router.js
var METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
  "query"
];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = /* @__PURE__ */ __name(class extends Error {
}, "UnsupportedPathError");

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/utils/mount.js
var countTrailingSlashes = /* @__PURE__ */ __name((path) => {
  let index = path.length;
  while (index > 0 && path.charCodeAt(index - 1) === 47)
    index--;
  return path.length - index;
}, "countTrailingSlashes");
var getPathPrefixLength = /* @__PURE__ */ __name((c, pathPrefix, routePath2) => {
  if (!/[:*]/.test(pathPrefix))
    return pathPrefix.length;
  const path = c.req.path;
  const matchResult = c.req[GET_MATCH_RESULT];
  const paramNames = /* @__PURE__ */ new Set();
  let length = 0;
  for (const part of splitRoutingPath(pathPrefix)) {
    if (part[0] === ":" && part.endsWith("}?"))
      throw new Error(`mount(): Optional regular expression parameters are not supported in "${routePath2}".`);
    const pattern = getPattern(part);
    if (pattern && pattern !== "*") {
      const name = pattern[1];
      if (paramNames.has(name))
        throw new Error(`mount(): Duplicate path parameter "${name}" in "${routePath2}".`);
      paramNames.add(name);
    }
    if (pattern && pattern !== "*" && pattern[2] !== true) {
      const value = matchResult.length === 2 ? matchResult[1][matchResult[0][c.req.routeIndex][1][pattern[1]]] : matchResult[0][c.req.routeIndex][1][pattern[1]];
      length += value.length + 1;
    } else if (pattern || part.endsWith("*")) {
      const end = path.indexOf("/", length + 1);
      length = end === -1 ? path.length : end;
    } else
      length += part.length + 1;
  }
  return length;
}, "getPathPrefixLength");
var createMountedRequest = /* @__PURE__ */ __name((c, pathPrefix, routePath2) => {
  if (/[^/]\*$/.test(routePath2))
    throw new Error(`mount(): Wildcard must follow "/" in "${routePath2}".`);
  const prefixLength = getPathPrefixLength(c, pathPrefix, routePath2);
  const path = c.req.path.slice(prefixLength) || "/";
  if (prefixLength > c.req.path.length || path[0] !== "/" || /\/(?:\.|%2e){1,2}(?:\/|$)/i.test(path))
    throw new HTTPException(400, { message: "Invalid mounted path" });
  const rawUrl = c.req.raw.url;
  if (/^[^/?#]*\/\/[^/?#\\]*[?#\\]/.test(rawUrl))
    throw new HTTPException(400, { message: "Invalid mounted path" });
  const rawPathEnd = rawUrl.search(/[?#]/);
  const rawTrailingSlashes = countTrailingSlashes(rawPathEnd === -1 ? rawUrl : rawUrl.slice(0, rawPathEnd));
  if (rawTrailingSlashes > 1 && countTrailingSlashes(c.req.path) === rawTrailingSlashes - 1)
    throw new HTTPException(400, { message: "Invalid mounted path" });
  const url = new URL(rawUrl);
  url.pathname = path.replace(/[\\\t\n\r]/g, encodeURIComponent);
  if (path.includes("%")) {
  }
  return new Request(url, c.req.raw);
}, "createMountedRequest");

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = /* @__PURE__ */ __name(class Hono2 {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    [...METHODS, "all"].forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string")
          this.#path = args1;
        else
          this.#addRoute(methodName, this.#path, args1);
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler of handlers)
            this.#addRoute(methodName, this.#path, handler);
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string")
        this.#path = arg1;
      else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute("ALL", this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono2({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  /**
  * `.route()` allows grouping other Hono instance in routes.
  *
  * @see {@link https://hono.dev/docs/api/routing#grouping}
  *
  * @param {string} path - base Path
  * @param {Hono} app - other Hono instance
  * @returns {Hono} routed Hono instance
  *
  * @example
  * ```ts
  * const app = new Hono()
  * const app2 = new Hono()
  *
  * app2.get("/user", (c) => c.text("user"))
  * app.route("/api", app2) // GET /api/user
  * ```
  */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler)
        handler = r.handler;
      else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
  * `.basePath()` allows base paths to be specified.
  *
  * @see {@link https://hono.dev/docs/api/routing#base-path}
  *
  * @param {string} path - base Path
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * const api = new Hono().basePath('/api')
  * ```
  */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
  * `.onError()` handles an error and returns a customized Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#error-handling}
  *
  * @param {ErrorHandler} handler - request Handler for error
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.onError((err, c) => {
  *   console.error(`${err}`)
  *   return c.text('Custom Error Message', 500)
  * })
  * ```
  */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
  * `.notFound()` allows you to customize a Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#not-found}
  *
  * @param {NotFoundHandler} handler - request handler for not-found
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.notFound((c) => {
  *   return c.text('Custom 404 Message', 404)
  * })
  * ```
  */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
  * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
  *
  * @deprecated Use `mount()` from `hono/mount` instead. `.mount()` will be removed in v5.
  *
  * @see {@link https://hono.dev/docs/api/hono#mount}
  *
  * @param {string} path - base Path
  * @param {Function} applicationHandler - other Request Handler
  * @param {MountOptions} [options] - options of `.mount()`
  * @returns {Hono} mounted Hono instance
  * @throws {Error} If automatic request rewriting encounters duplicate path parameter names or an optional regular expression parameter.
  * @throws {HTTPException} With status 400 if automatic request rewriting cannot safely preserve the routed path.
  *
  * @example
  * ```ts
  * import { Router as IttyRouter } from 'itty-router'
  * import { Hono } from 'hono'
  * // Create itty-router application
  * const ittyRouter = IttyRouter()
  * // GET /itty-router/hello
  * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
  *
  * const app = new Hono()
  * app.mount('/itty-router', ittyRouter.handle)
  * ```
  *
  * @example
  * ```ts
  * const app = new Hono()
  * // Send the request to another application without modification.
  * app.mount('/app', anotherApp, {
  *   replaceRequest: (req) => req,
  * })
  * ```
  */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function")
        optionHandler = options;
      else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false)
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        else
          replaceRequest = options.replaceRequest;
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    const defaultReplaceRequest = /* @__PURE__ */ __name((c) => {
      const mountedRoutePath = routePath(c);
      return createMountedRequest(c, mountedRoutePath.replace(/\/?\*$/, ""), mountedRoutePath);
    }, "defaultReplaceRequest");
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest ? replaceRequest(c.req.raw) : defaultReplaceRequest(c), ...getOptions(c));
      if (res)
        return res;
      await next();
    }, "handler");
    this.#addRoute("ALL", mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error)
      return this.errorHandler(err, c);
    throw err;
  }
  #dispatch(request, executionCtx, env2, method) {
    if (method === "HEAD")
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env2, "GET")))();
    const path = this.getPath(request, { env: env2 });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env: env2,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context2 = await composed(c);
        if (!context2.finalized)
          throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
        return context2.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
  * `.fetch()` will be entry point of your app.
  *
  * @see {@link https://hono.dev/docs/api/hono#fetch}
  *
  * @param {Request} request - request Object of request
  * @param {Env} env - env Object
  * @param {ExecutionContext} executionCtx - context of execution
  * @returns {Response | Promise<Response>} response of request
  *
  */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
  * `.request()` is a useful method for testing.
  * You can pass a URL or pathname to send a GET request.
  * app will return a Response object.
  * ```ts
  * test('GET /hello is ok', async () => {
  *   const res = await app.request('/hello')
  *   expect(res.status).toBe(200)
  * })
  * ```
  * @see https://hono.dev/docs/api/hono#request
  */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request)
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    input = input.toString();
    return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
  };
  /**
  * `.fire()` automatically adds a global fetch event listener.
  * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
  * @deprecated
  * Use `fire` from `hono/service-worker` instead.
  * ```ts
  * import { Hono } from 'hono'
  * import { fire } from 'hono/service-worker'
  *
  * const app = new Hono()
  * // ...
  * fire(app)
  * ```
  * @see https://hono.dev/docs/api/hono#fire
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
  */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
}, "Hono");

// node_modules/hono/dist/router/utils.js
var createNullObject = /* @__PURE__ */ __name(() => /* @__PURE__ */ Object.create(null), "createNullObject");

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name((method2, path2) => {
    const matcher = matchers[method2] || matchers["ALL"];
    const staticMatch = matcher[2][path2];
    if (staticMatch)
      return staticMatch;
    const match3 = path2.match(matcher[0]);
    if (!match3)
      return [[], emptyParam];
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }, "match");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = "[^]*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/[^]*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = /* @__PURE__ */ new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1)
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  if (b.length === 1)
    return 1;
  if (a === "[^]*" || a === "(?:|/[^]*)")
    return b === "[^]*" ? -1 : 1;
  else if (b === "[^]*" || b === "(?:|/[^]*)")
    return -1;
  if (a === "[^/]+")
    return 1;
  else if (b === "[^/]+")
    return -1;
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = /* @__PURE__ */ __name(class Node2 {
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context2, keys) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? [
        "",
        "",
        ONLY_WILDCARD_REG_EXP_STR
      ] : [
        "",
        "",
        LABEL_REG_EXP_STR
      ] : null : token === "/*" ? [
        "",
        "",
        TAIL_WILDCARD_REG_EXP_STR
      ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || "[^/]+";
        if (name && pattern[2]) {
          if (new RegExp(regexpStr).test(""))
            throw PATH_ERROR;
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr))
            throw PATH_ERROR;
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr))
            throw PATH_ERROR;
        }
        keys.push(regexpStr);
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== "[^]*" && regexpStr !== "(?:|/[^]*)") {
            for (const k in node.#children)
              if ((regexpStr.length > 1 || k.length > 1) && k !== "[^]*" && k !== "(?:|/[^]*)")
                throw PATH_ERROR;
          }
          nextNode = node.#children[regexpStr] = new Node2();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context2.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        keys.push(token);
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children)
            if (k.length > 1 && k !== "[^]*" && k !== "(?:|/[^]*)")
              throw PATH_ERROR;
          nextNode = node.#children[token] = new Node2();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0)
      throw PATH_ERROR;
    node.#index = index;
  }
  buildRegExpStr() {
    const strList = Object.keys(this.#children).sort(compareKey).map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1)
      strList.unshift(`#${this.#index}`);
    if (strList.length === 0)
      return "";
    if (strList.length === 1)
      return strList[0];
    return "(?:" + strList.join("|") + ")";
  }
}, "Node");

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = /* @__PURE__ */ __name(class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  paths = createNullObject();
  insert(path, isStatic) {
    const keys = [];
    if (isStatic) {
      this.#root.insert(path.split(""), -1, [], this.#context, keys);
      this.paths[path] = [
        -1,
        [],
        keys
      ];
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{(?:\{[\d,]+\}|[^}])+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced)
        break;
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./gs) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--)
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, keys);
    this.paths[path] = [
      this.#index++,
      paramAssoc,
      keys
    ];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "")
      return [
        /^$/,
        [],
        []
      ];
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [
      new RegExp(`^${regexp}`),
      indexReplacementMap,
      paramReplacementMap
    ];
  }
}, "Trie");

// node_modules/hono/dist/router/reg-exp-router/router.js
function endsWithWildcard(keys) {
  const tail = keys[keys.length - 1];
  return tail === "[^]*" || tail === "(?:|/[^]*)";
}
__name(endsWithWildcard, "endsWithWildcard");
function covers(wildcard, target) {
  const last = wildcard.length - 1;
  for (let i = 0; i < last; i++)
    if (wildcard[i] !== target[i])
      return false;
  return wildcard[last] === "[^]*" || target.length === last || target[last] === "/";
}
__name(covers, "covers");
var RegExpRouter = /* @__PURE__ */ __name(class {
  name = "RegExpRouter";
  #handlers;
  #tries;
  constructor() {
    this.#handlers = { ["ALL"]: [] };
    this.#tries = { ["ALL"]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const handlers = this.#handlers;
    if (!handlers)
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    const tries = this.#tries;
    if (!handlers[method]) {
      tries[method] = new Trie();
      handlers[method] = [...handlers["ALL"]];
      for (const p in tries["ALL"].paths)
        this.#insertPath(method, p);
    }
    if (path === "/*")
      path = "*";
    const methods = method === "ALL" ? Object.keys(handlers) : [method];
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths)
      for (const m of methods) {
        if (!tries[m].paths[path2])
          this.#insertPath(m, path2);
        handlers[m].push([handler, path2]);
      }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#handlers))
      matchers[method] = this.#buildMatcher(method);
    this.#handlers = this.#tries = void 0;
    return matchers;
  }
  #buildMatcher(method) {
    const handlers = this.#handlers[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    const own = createNullObject();
    const entries = handlers.map(([h, p], i) => {
      (own[p] ??= []).push(i);
      return [h, trie.paths[p][1].reduceRight((map, [key, varIndex]) => {
        map[key] = paramReplacementMap[varIndex];
        return map;
      }, createNullObject())];
    });
    const wildcards = Object.keys(own).filter((p) => endsWithWildcard(trie.paths[p][2]));
    for (const path in trie.paths) {
      const [index, , keys] = trie.paths[path];
      const indexes = [...own[path]];
      for (const p of wildcards)
        if (p !== path && covers(trie.paths[p][2], keys))
          indexes.push(...own[p]);
      const data = indexes.sort((a, b) => a - b).map((i) => entries[i]);
      if (index === -1) {
        const last = Math.max(-1, ...data.flatMap(([, map]) => Object.values(map)));
        staticMap[path] = [data, last === -1 ? emptyParam : path.match(regexp).slice(0, last + 1)];
      } else
        handlerData[index] = data;
    }
    return [
      regexp,
      indexReplacementMap.map((i) => handlerData[i]),
      staticMap
    ];
  }
}, "RegExpRouter");

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = /* @__PURE__ */ __name(class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes)
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    this.#routes.push([
      method,
      path,
      handler
    ]);
  }
  match(method, path) {
    if (!this.#routes)
      throw new Error("Fatal error");
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++)
          router.add(...routes[i2]);
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError)
          continue;
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len)
      throw new Error("Fatal error");
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1)
      throw new Error("No active router has been determined yet.");
    return this.#routers[0];
  }
}, "SmartRouter");

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node3 = /* @__PURE__ */ __name(class Node4 {
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new Node4();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam)
        possibleKeys.add(pattern[1]);
    }
    curNode.#methods.push({ [method]: {
      handler,
      possibleKeys: [...possibleKeys],
      score: ++order
    } });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m["ALL"];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    let curNodes = [this];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"])
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else
            tempNodes.push(nextNode);
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true)
            continue;
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              if (!Object.hasOwn(params, name))
                params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"])
                this.#pushHandlerSets(handlerSets, child.#children["*"], method, node.#params, params);
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                (curNodesQueue[componentCount] ||= []).push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            if (!Object.hasOwn(params, name))
              params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"])
                this.#pushHandlerSets(handlerSets, child.#children["*"], method, params, node.#params);
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1])
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
}, "Node");

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = /* @__PURE__ */ __name(class {
  name = "TrieRouter";
  #node = new Node3();
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path])
      this.#node.insert(method, result, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
}, "TrieRouter");

// node_modules/hono/dist/hono.js
var Hono3 = /* @__PURE__ */ __name(class extends Hono {
  /**
  * Creates an instance of the Hono class.
  *
  * @param options - Optional configuration options for the Hono instance.
  */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({ routers: [new RegExpRouter(), new TrieRouter()] });
  }
}, "Hono");

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const opts = {
    origin: "*",
    allowMethods: [
      "GET",
      "HEAD",
      "PUT",
      "POST",
      "DELETE",
      "PATCH",
      "QUERY"
    ],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const exposeHeadersStr = opts.exposeHeaders?.length ? opts.exposeHeaders.join(",") : void 0;
  const allowHeadersStr = opts.allowHeaders?.length ? opts.allowHeaders.join(",") : void 0;
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*")
        return () => optsOrigin;
      else
        return (origin) => optsOrigin === origin ? origin : null;
    } else if (typeof optsOrigin === "function")
      return optsOrigin;
    else
      return (origin) => optsOrigin.includes(origin) ? origin : null;
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function")
      return async (origin, c) => (await optsAllowMethods(origin, c)).join(",");
    else if (Array.isArray(optsAllowMethods)) {
      const methodsStr = optsAllowMethods.join(",");
      return () => methodsStr;
    } else
      return () => "";
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin)
      set("Access-Control-Allow-Origin", allowOrigin);
    if (opts.credentials)
      set("Access-Control-Allow-Credentials", "true");
    if (exposeHeadersStr)
      set("Access-Control-Expose-Headers", exposeHeadersStr);
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*")
        c.res.headers.append("Vary", "Origin");
      if (opts.maxAge != null)
        set("Access-Control-Max-Age", opts.maxAge.toString());
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods)
        set("Access-Control-Allow-Methods", allowMethods);
      let headersStr = allowHeadersStr;
      if (!headersStr) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders)
          headersStr = requestHeaders.split(",").map((h) => h.trim()).join(",");
      }
      if (headersStr) {
        set("Access-Control-Allow-Headers", headersStr);
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*")
      c.header("Vary", "Origin", { append: true });
  }, "cors");
}, "cors");

// src/auth.ts
function generateSalt() {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return bufferToHex(buffer);
}
__name(generateSalt, "generateSalt");
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: hexToBuffer(salt),
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  return bufferToHex(new Uint8Array(derivedBits));
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, salt, storedHash) {
  const hash = await hashPassword(password, salt);
  if (hash.length !== storedHash.length)
    return false;
  let result = 0;
  for (let i = 0; i < hash.length; i++) {
    result |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}
__name(verifyPassword, "verifyPassword");
async function getJWTKey(secret) {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
__name(getJWTKey, "getJWTKey");
async function createJWT(payload, secret, expiresInSeconds = 7 * 24 * 60 * 60) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1e3);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const key = await getJWTKey(secret);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signingInput)
  );
  const encodedSignature = base64UrlEncodeBuffer(new Uint8Array(signature));
  return `${signingInput}.${encodedSignature}`;
}
__name(createJWT, "createJWT");
async function verifyJWT(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3)
      return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const key = await getJWTKey(secret);
    const encoder = new TextEncoder();
    const signatureBuffer = base64UrlDecodeToBuffer(encodedSignature);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBuffer,
      encoder.encode(signingInput)
    );
    if (!valid)
      return null;
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1e3);
    if (payload.exp < now)
      return null;
    return payload;
  } catch {
    return null;
  }
}
__name(verifyJWT, "verifyJWT");
function setSessionCookie(cookieName, token, maxAgeSec = 7 * 24 * 60 * 60) {
  return `${cookieName}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSec}`;
}
__name(setSessionCookie, "setSessionCookie");
function clearSessionCookie(cookieName) {
  return `${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
__name(clearSessionCookie, "clearSessionCookie");
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader)
    return cookies;
  cookieHeader.split(";").forEach((pair) => {
    const [key, ...vals] = pair.split("=");
    if (key) {
      cookies[key.trim()] = vals.join("=").trim();
    }
  });
  return cookies;
}
__name(parseCookies, "parseCookies");
function generateId() {
  return crypto.randomUUID();
}
__name(generateId, "generateId");
function bufferToHex(buffer) {
  return Array.from(buffer).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(bufferToHex, "bufferToHex");
function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
__name(hexToBuffer, "hexToBuffer");
function base64UrlEncode(str) {
  const encoder = new TextEncoder();
  return base64UrlEncodeBuffer(encoder.encode(str));
}
__name(base64UrlEncode, "base64UrlEncode");
function base64UrlEncodeBuffer(buffer) {
  let binary = "";
  for (const byte of buffer) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64UrlEncodeBuffer, "base64UrlEncodeBuffer");
function base64UrlDecode(str) {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  return atob(padded);
}
__name(base64UrlDecode, "base64UrlDecode");
function base64UrlDecodeToBuffer(str) {
  const decoded = base64UrlDecode(str);
  const buffer = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    buffer[i] = decoded.charCodeAt(i);
  }
  return buffer;
}
__name(base64UrlDecodeToBuffer, "base64UrlDecodeToBuffer");

// src/frontend.ts
function renderHTML() {
  return (
    /*html*/
    `<!DOCTYPE html>
<html lang="vi" x-data="app()" :class="{ 'dark': darkMode }">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>To-Do List</title>

  <!-- PWA Web App Manifest & Meta Tags (Hi\u1EC7n t\xEAn To-Do List tr\xEAn h\u1EC7 th\u1ED1ng) -->
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="To-Do List">
  <meta name="application-name" content="To-Do List">

  <!-- Icons chu\u1EA9n PNG cho iOS, Windows v\xE0 Tr\xECnh duy\u1EC7t -->
  <link rel="icon" type="image/png" href="/icon-192.png">
  <link rel="apple-touch-icon" href="/icon-192.png">

  <script src="https://cdn.tailwindcss.com"><\/script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"><\/script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
              400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
              800: '#1e40af', 900: '#1e3a8a'
            }
          }
        }
      }
    }
  <\/script>
  <style>
    [x-cloak] { display: none !important; }
    .toast-enter { animation: toastIn 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes toastIn { from { opacity:0; transform:translateY(-16px) scale(0.94); } to { opacity:1; transform:translateY(0) scale(1); } }
    @keyframes spin { to { transform:rotate(360deg); } }
    .spinner { animation: spin 0.7s linear infinite; }
    .line-through-anim { text-decoration: line-through; color: #9ca3af; }
    
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .dark ::-webkit-scrollbar-thumb { background: #334155; }

    @keyframes pulse-warning {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .animate-pulse-warning {
      animation: pulse-warning 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    button, a, input, select {
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
  </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans transition-colors duration-200 pb-20 sm:pb-6 selection:bg-brand-500 selection:text-white">

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550 TOAST NOTIFICATIONS \u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div class="fixed top-4 right-4 left-4 sm:left-auto z-[120] space-y-2 pointer-events-none" x-cloak>
  <template x-for="toast in toasts" :key="toast.id">
    <div class="toast-enter pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold max-w-md ml-auto border transition-all"
         :class="{
           'bg-emerald-600 border-emerald-500 text-white': toast.type === 'success',
           'bg-rose-600 border-rose-500 text-white': toast.type === 'error',
           'bg-amber-600 border-amber-500 text-white': toast.type === 'warning',
           'bg-blue-600 border-blue-500 text-white': toast.type === 'info'
         }">
      <div class="flex items-center gap-2.5">
        <svg x-show="toast.type==='success'" class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <svg x-show="toast.type==='error'" class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <svg x-show="toast.type==='warning'" class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <svg x-show="toast.type==='info'" class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span x-text="toast.message" class="break-words"></span>
      </div>
      <button @click="removeToast(toast.id)" class="opacity-70 hover:opacity-100 p-1 text-white">\u2715</button>
    </div>
  </template>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550 AUTH SCREEN (\u0110\u0103ng nh\u1EADp / \u0110\u0103ng k\xFD) \u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div x-show="!authenticated" x-cloak class="min-h-screen flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-blue-400 text-white shadow-lg shadow-brand-500/30 mb-4 ring-4 ring-brand-100 dark:ring-brand-950">
        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h1 class="text-3xl font-extrabold bg-gradient-to-r from-brand-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">To-Do List</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Cloudflare Edge & D1 Serverless</p>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 backdrop-blur-xl">
      <div class="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-6">
        <button @click="authMode='login'" class="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
                :class="authMode==='login' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'">
          \u0110\u0103ng nh\u1EADp
        </button>
        <button @click="authMode='register'" class="flex-1 py-2.5 text-sm font-bold rounded-xl transition-all"
                :class="authMode==='register' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'">
          \u0110\u0103ng k\xFD
        </button>
      </div>

      <form @submit.prevent="handleAuth" class="space-y-4">
        <div x-show="authMode==='register'" class="space-y-1.5">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">T\xEAn ng\u01B0\u1EDDi d\xF9ng</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            <input x-model="authForm.username" type="text" placeholder="H\u1ECD v\xE0 t\xEAn..."
                   class="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm font-medium" />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Email</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </span>
            <input x-model="authForm.email" type="email" placeholder="you@example.com" required
                   class="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm font-medium" />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">M\u1EADt kh\u1EA9u</label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            <input x-model="authForm.password" type="password" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" required minlength="6"
                   class="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm font-medium" />
          </div>
        </div>

        <button type="submit" :disabled="authLoading"
                class="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
          <svg x-show="authLoading" class="spinner w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg>
          <span x-text="authMode==='login' ? '\u0110\u0103ng nh\u1EADp ngay' : 'T\u1EA1o t\xE0i kho\u1EA3n m\u1EDBi'"></span>
        </button>
      </form>
    </div>

    <div class="mt-6 text-center">
      <button @click="toggleDarkMode()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-semibold inline-flex items-center gap-2 p-2 rounded-xl transition">
        <svg x-show="!darkMode" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        <svg x-show="darkMode" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <span x-text="darkMode ? 'Chuy\u1EC3n sang Ch\u1EBF \u0111\u1ED9 S\xE1ng' : 'Chuy\u1EC3n sang Ch\u1EBF \u0111\u1ED9 T\u1ED1i'"></span>
      </button>
    </div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550 MAIN APPLICATION INTERFACE \u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div x-show="authenticated" x-cloak class="min-h-screen flex flex-col">

  <!-- \u2500\u2500\u2500 Modern Sticky Header \u2500\u2500\u2500 -->
  <header class="sticky top-0 z-50 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
      
      <!-- Brand Logo & App Name -->
      <div class="flex items-center gap-3">
        <img src="/icon-192.png" alt="To-Do List Logo" class="w-9 h-9 rounded-xl shadow-md shadow-brand-500/25" />
        <div>
          <h1 class="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-brand-600 to-blue-500 bg-clip-text text-transparent leading-none">To-Do List</h1>
          <span class="text-[10px] font-medium text-slate-400 hidden sm:inline">Cloudflare Edge & D1</span>
        </div>
      </div>

      <!-- Action Toolbar (Icons8 Clean Vectors) -->
      <div class="flex items-center gap-1 sm:gap-2">
        
        <!-- N\xDAT DOWNLOAD APP (PC / iOS) N\u1ED4I B\u1EACT -->
        <button @click="showDownloadModal = true"
                class="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/70 dark:hover:bg-brand-900 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 transition shadow-sm active:scale-95"
                title="T\u1EA3i \u1EE9ng d\u1EE5ng cho PC ho\u1EB7c iOS">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span class="font-extrabold">Download</span>
        </button>

        <!-- N\xFAt B\u1EADt/T\u1EAFt Chu\xF4ng th\xF4ng b\xE1o 30 ph\xFAt (Notification Bell) -->
        <button @click="toggleNotificationPermission()"
                class="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                :class="notificationsEnabled
                  ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 ring-1 ring-amber-300 dark:ring-amber-800'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'"
                :title="notificationsEnabled ? '\u0110\xE3 b\u1EADt nh\u1EAFc nh\u1EDF tr\u01B0\u1EDBc 30 ph\xFAt' : 'B\u1EADt nh\u1EAFc nh\u1EDF tr\u01B0\u1EDBc 30 ph\xFAt'">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span class="hidden sm:inline" x-text="notificationsEnabled ? 'B\xE1o tr\u01B0\u1EDBc 30p: B\u1EADt' : 'Nh\u1EAFc nh\u1EDF'"></span>
        </button>

        <!-- Xu\u1EA5t JSON Backup -->
        <button @click="exportTodos()" class="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Sao l\u01B0u d\u1EEF li\u1EC7u (Export JSON)">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
            <path d="M12 12v9"></path>
            <path d="m8 17 4 4 4-4"></path>
          </svg>
        </button>

        <!-- \u0110\u1ED5i Dark/Light Mode -->
        <button @click="toggleDarkMode()" class="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition" :title="darkMode ? 'Ch\u1EBF \u0111\u1ED9 S\xE1ng' : 'Ch\u1EBF \u0111\u1ED9 T\u1ED1i'">
          <svg x-show="!darkMode" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg x-show="darkMode" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </button>

        <!-- \u0110\u0103ng xu\u1EA5t -->
        <button @click="logout()" class="p-2 sm:px-3 sm:py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold" title="\u0110\u0103ng xu\u1EA5t">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span class="hidden sm:inline">Tho\xE1t</span>
        </button>
      </div>
    </div>
  </header>

  <!-- \u2500\u2500\u2500 Banner th\xF4ng b\xE1o nh\u1EAFc nh\u1EDF 30 ph\xFAt \u2500\u2500\u2500 -->
  <div x-show="imminentTodos.length > 0" x-cloak
       class="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 px-4 shadow-md">
    <div class="max-w-5xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
      <div class="flex items-center gap-2 overflow-hidden">
        <svg class="w-5 h-5 flex-shrink-0 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span class="truncate">
          <strong>S\u1EAFp \u0111\u1EBFn h\u1EA1n (&le; 30 ph\xFAt):</strong>
          <span x-text="imminentTodos.map(t => '"' + t.title + '"').join(', ')"></span>
        </span>
      </div>
      <button @click="filterStatus='pending'; filterPriority='High'; fetchTodos()"
              class="flex-shrink-0 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition">
        Xem ngay
      </button>
    </div>
  </div>

  <!-- \u2500\u2500\u2500 Main Content Container \u2500\u2500\u2500 -->
  <main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6">

    <!-- \u2500\u2500\u2500 Stats Cards (Mobile 2x2 grid) \u2500\u2500\u2500 -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-500 dark:text-slate-400">T\u1ED4NG VI\u1EC6C</span>
          <div class="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-brand-600 dark:text-brand-400">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white" x-text="stats.total">0</div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-500 dark:text-slate-400">\u0110ANG CH\u1EDC</span>
          <div class="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400" x-text="stats.pending">0</div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-500 dark:text-slate-400">HO\xC0N TH\xC0NH</span>
          <div class="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400" x-text="stats.completed">0</div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold text-slate-500 dark:text-slate-400">QU\xC1 H\u1EA0N</span>
          <div class="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
        </div>
        <div class="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400" x-text="stats.overdue">0</div>
      </div>
    </div>

    <!-- \u2500\u2500\u2500 Progress Bar \u2500\u2500\u2500 -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 mb-4 shadow-sm" x-show="stats.total > 0">
      <div class="flex items-center justify-between text-xs font-bold mb-2">
        <span class="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
          Ti\u1EBFn \u0111\u1ED9 c\xF4ng vi\u1EC7c
        </span>
        <span class="text-brand-600 dark:text-brand-400" x-text="stats.percent + '% (' + stats.completed + '/' + stats.total + ' vi\u1EC7c)'"></span>
      </div>
      <div class="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
        <div class="h-full bg-gradient-to-r from-brand-500 via-blue-500 to-emerald-500 transition-all duration-500 rounded-full" :style="'width: ' + stats.percent + '%'"></div>
      </div>
    </div>

    <!-- \u2500\u2500\u2500 Search & Mobile Horizontal Chips \u2500\u2500\u2500 -->
    <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 mb-5 space-y-3 shadow-sm">
      <div class="relative">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
        <input x-model="searchQuery" @input.debounce.300ms="fetchTodos()" type="text" placeholder="T\xECm ki\u1EBFm c\xF4ng vi\u1EC7c nhanh..."
               class="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm font-medium" />
      </div>

      <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
        <template x-for="s in statusFilters" :key="s.value">
          <button @click="filterStatus = s.value; fetchTodos()"
                  class="flex-shrink-0 px-3.5 py-2 text-xs font-bold rounded-xl border transition flex items-center gap-1.5"
                  :class="filterStatus === s.value
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-brand-400'">
            <span x-html="s.icon"></span>
            <span x-text="s.label"></span>
          </button>
        </template>
      </div>

      <div class="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        <select x-model="filterCategory" @change="fetchTodos()"
                class="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none cursor-pointer">
          <option value="all">\u{1F4C1} Danh m\u1EE5c (T\u1EA5t c\u1EA3)</option>
          <template x-for="cat in categories" :key="cat">
            <option :value="cat" x-text="cat"></option>
          </template>
        </select>

        <select x-model="filterPriority" @change="fetchTodos()"
                class="w-full sm:w-auto px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none cursor-pointer">
          <option value="all">\u26A1 \u01AFu ti\xEAn (T\u1EA5t c\u1EA3)</option>
          <option value="High">\u{1F534} Kh\u1EA9n c\u1EA5p (High)</option>
          <option value="Medium">\u{1F7E1} B\xECnh th\u01B0\u1EDDng (Medium)</option>
          <option value="Low">\u{1F7E2} Th\u1EA5p (Low)</option>
        </select>

        <select x-model="sortBy" @change="fetchTodos()"
                class="col-span-2 sm:col-span-1 sm:ml-auto px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none cursor-pointer">
          <option value="due_date-asc">\u{1F4C5} H\u1EA1n ch\xF3t (G\u1EA7n \u2192 Xa)</option>
          <option value="due_date-desc">\u{1F4C5} H\u1EA1n ch\xF3t (Xa \u2192 G\u1EA7n)</option>
          <option value="created_at-desc">\u{1F550} M\u1EDBi nh\u1EA5t tr\u01B0\u1EDBc</option>
          <option value="created_at-asc">\u{1F550} C\u0169 nh\u1EA5t tr\u01B0\u1EDBc</option>
        </select>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs" x-show="stats.completed > 0">
        <span class="text-slate-400">\u0110\xE3 xong <strong x-text="stats.completed" class="text-emerald-600"></strong> vi\u1EC7c</span>
        <button @click="confirmClearCompleted()" class="text-rose-500 hover:text-rose-600 font-bold inline-flex items-center gap-1.5 transition">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          D\u1ECDn d\u1EB9p vi\u1EC7c \u0111\xE3 xong
        </button>
      </div>
    </div>

    <!-- \u2500\u2500\u2500 N\xFAt th\xEAm vi\u1EC7c m\u1EDBi (Desktop Banner Button) \u2500\u2500\u2500 -->
    <button @click="openCreateModal()"
            class="hidden sm:flex w-full mb-5 py-3.5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 rounded-3xl text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition items-center justify-center gap-2 text-sm font-bold shadow-sm group">
      <div class="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-50 dark:group-hover:bg-brand-950 transition">
        <svg class="w-4 h-4 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </div>
      Th\xEAm c\xF4ng vi\u1EC7c m\u1EDBi
    </button>

    <!-- \u2500\u2500\u2500 Loading Spinner \u2500\u2500\u2500 -->
    <div x-show="todosLoading" class="flex justify-center py-12">
      <svg class="spinner w-8 h-8 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg>
    </div>

    <!-- \u2500\u2500\u2500 Empty State \u2500\u2500\u2500 -->
    <div x-show="!todosLoading && todos.length === 0" class="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div class="w-16 h-16 mx-auto mb-4 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
      </div>
      <h3 class="text-base font-bold text-slate-800 dark:text-slate-200">Kh\xF4ng c\xF3 c\xF4ng vi\u1EC7c n\xE0o</h3>
      <p class="text-xs text-slate-400 mt-1 max-w-xs mx-auto">B\u1EA1n ch\u01B0a c\xF3 t\xE1c v\u1EE5 n\xE0o trong danh s\xE1ch ho\u1EB7c kh\xF4ng kh\u1EDBp v\u1EDBi b\u1ED9 l\u1ECDc hi\u1EC7n t\u1EA1i.</p>
    </div>

    <!-- \u2500\u2500\u2500 Todo List Item Cards \u2500\u2500\u2500 -->
    <div class="space-y-3" x-show="!todosLoading && todos.length > 0">
      <template x-for="todo in todos" :key="todo.id">
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 hover:shadow-md transition-all group relative"
             :class="{
               'opacity-50 bg-slate-50/50 dark:bg-slate-900/50': todo.is_completed,
               'border-amber-300 dark:border-amber-800/80 ring-2 ring-amber-300/30': todo.is_pinned && !todo.is_completed
             }">
          <div class="flex items-start gap-3 sm:gap-4">
            
            <button @click="toggleTodo(todo)" class="mt-0.5 flex-shrink-0 w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer"
                    :class="todo.is_completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-brand-500'">
              <svg x-show="todo.is_completed" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>

            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2 flex-wrap">
                  <span x-show="todo.is_pinned" class="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                    <svg class="w-3 h-3 text-amber-500" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>
                    \u0110\xE3 ghim
                  </span>

                  <h3 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white break-words"
                      :class="todo.is_completed && 'line-through-anim'" x-text="todo.title"></h3>
                </div>

                <div class="flex-shrink-0 flex items-center gap-0.5 sm:gap-1">
                  <button @click="togglePin(todo)" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          :class="todo.is_pinned ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'" :title="todo.is_pinned ? 'B\u1ECF ghim' : 'Ghim l\xEAn \u0111\u1EA7u'">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14l-2-7V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v6L5 17z"/></svg>
                  </button>

                  <button @click="duplicateTodo(todo)" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition" title="Nh\xE2n b\u1EA3n">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>

                  <button @click="openEditModal(todo)" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-brand-600 transition" title="S\u1EEDa">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>

                  <button @click="confirmDelete(todo)" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition" title="X\xF3a">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </div>

              <p x-show="todo.description" class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2" x-text="todo.description"></p>

              <div class="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                      :class="{
                        'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900': todo.priority==='High',
                        'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900': todo.priority==='Medium',
                        'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900': todo.priority==='Low'
                      }">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <span x-text="todo.priority"></span>
                </span>

                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  <span x-text="todo.category"></span>
                </span>

                <span x-show="todo.due_date" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                      :class="isOverdue(todo)
                        ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                        : isWithin30Minutes(todo)
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-400 animate-pulse-warning'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'">
                  <svg x-show="isOverdue(todo)" class="w-3 h-3 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <svg x-show="!isOverdue(todo) && isWithin30Minutes(todo)" class="w-3 h-3 text-amber-600 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <svg x-show="!isOverdue(todo) && !isWithin30Minutes(todo)" class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span x-text="formatDateDisplay(todo.due_date)"></span>
                </span>

                <span x-show="isWithin30Minutes(todo)" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-orange-600 text-white animate-pulse">
                  \u23F0 S\u1EAFp h\u1EBFt h\u1EA1n (&lt; 30p)
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </main>

  <!-- \u2500\u2500\u2500 Floating Action Button (FAB) cho Mobile \u2500\u2500\u2500 -->
  <div class="fixed bottom-5 right-5 sm:hidden z-40">
    <button @click="openCreateModal()"
            class="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 to-blue-500 text-white shadow-2xl shadow-brand-600/40 flex items-center justify-center active:scale-95 transition-all ring-4 ring-white dark:ring-slate-900"
            title="Th\xEAm vi\u1EC7c m\u1EDBi">
      <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550 MODAL T\u1EA2I \u1EE8NG D\u1EE4NG (DOWNLOAD FOR PC / IOS) \u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div x-show="showDownloadModal" x-cloak class="fixed inset-0 z-[115] flex items-end sm:items-center justify-center sm:p-4"
     x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 translate-y-8 sm:translate-y-0" x-transition:enter-end="opacity-100 translate-y-0"
     x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 translate-y-0" x-transition:leave-end="opacity-0 translate-y-8 sm:translate-y-0">
  
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showDownloadModal=false"></div>

  <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 max-h-[92vh] overflow-y-auto" @click.stop>
    
    <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden"></div>

    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-2.5">
        <img src="/icon-192.png" alt="Logo" class="w-8 h-8 rounded-xl shadow-sm" />
        <h2 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white">C\xE0i \u0111\u1EB7t \u1EE9ng d\u1EE5ng To-Do List</h2>
      </div>
      <button @click="showDownloadModal=false" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- Tab Ch\u1ECDn H\u1EC7 \u0110i\u1EC1u H\xE0nh (PC / iOS) -->
    <div class="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-5">
      <button @click="downloadTab='pc'" class="flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              :class="downloadTab==='pc' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        Download for PC
      </button>
      <button @click="downloadTab='ios'" class="flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              :class="downloadTab==='ios' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
        Download for iOS
      </button>
    </div>

    <!-- \u2500\u2500\u2500 TAB 1: DOWNLOAD FOR PC (WINDOWS / MAC) \u2500\u2500\u2500 -->
    <div x-show="downloadTab==='pc'" class="space-y-4">
      <div class="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-xs sm:text-sm text-blue-900 dark:text-blue-300 space-y-2">
        <p class="font-bold flex items-center gap-1.5">
          <svg class="w-4 h-4 text-brand-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          L\u1EE3i \xEDch khi c\xE0i \u0111\u1EB7t b\u1EA3n PC App:
        </p>
        <ul class="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
          <li>Ch\u1EA1y \u0111\u1ED9c l\u1EADp nh\u01B0 m\u1ED9t ph\u1EA7n m\u1EC1m m\xE1y t\xEDnh (c\xF3 icon ri\xEAng tr\xEAn Desktop & Taskbar).</li>
          <li><strong>Th\xF4ng b\xE1o s\u1EBD hi\u1EC3n th\u1ECB t\xEAn "To-Do List"</strong> v\xE0 logo chu\u1EA9n thay v\xEC t\xEAn mi\u1EC1n website!</li>
          <li>Nh\u1EADn th\xF4ng b\xE1o ngay c\u1EA3 khi \u0111\xF3ng tab tr\xECnh duy\u1EC7t.</li>
        </ul>
      </div>

      <!-- N\xFAt 1-click Install n\u1EBFu tr\xECnh duy\u1EC7t h\u1ED7 tr\u1EE3 beforeinstallprompt -->
      <button @click="installPWA()"
              class="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition flex items-center justify-center gap-2 text-sm">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>C\xE0i \u0111\u1EB7t ngay v\xE0o m\xE1y t\xEDnh (1-Click)</span>
      </button>

      <!-- H\u01B0\u1EDBng d\u1EABn th\u1EE7 c\xF4ng n\u1EBFu n\xFAt 1-click kh\xF4ng hi\u1EC7n -->
      <div class="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1">
        <p class="font-semibold text-slate-700 dark:text-slate-300">Ho\u1EB7c c\xE0i \u0111\u1EB7t t\u1EEB tr\xECnh duy\u1EC7t:</p>
        <p>\u2022 <strong>Microsoft Edge</strong>: B\u1EA5m bi\u1EC3u t\u01B0\u1EE3ng <strong>App (\u1EE8ng d\u1EE5ng)</strong> \u1EDF g\xF3c ph\u1EA3i thanh \u0111\u1ECBa ch\u1EC9 URL &gt; ch\u1ECDn <strong>C\xE0i \u0111\u1EB7t (Install)</strong>.</p>
        <p>\u2022 <strong>Google Chrome</strong>: B\u1EA5m n\xFAt menu 3 ch\u1EA5m d\u1ECDc \u1EDF g\xF3c ph\u1EA3i &gt; ch\u1ECDn <strong>L\u01B0u & chia s\u1EBB &gt; C\xE0i \u0111\u1EB7t To-Do List...</strong></p>
      </div>
    </div>

    <!-- \u2500\u2500\u2500 TAB 2: DOWNLOAD FOR IOS (IPHONE / IPAD) \u2500\u2500\u2500 -->
    <div x-show="downloadTab==='ios'" class="space-y-4">
      <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-xs sm:text-sm text-amber-900 dark:text-amber-300 space-y-2">
        <p class="font-bold flex items-center gap-1.5">
          <svg class="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          C\u01A1 ch\u1EBF c\xE0i \u0111\u1EB7t \u1EE9ng d\u1EE5ng Web tr\xEAn iOS (Apple):
        </p>
        <p class="text-slate-700 dark:text-slate-300">
          Apple h\u1ED7 tr\u1EE3 c\xE0i \u0111\u1EB7t \u1EE9ng d\u1EE5ng web l\xEAn m\xE0n h\xECnh ch\xEDnh iPhone th\xF4ng qua <strong>H\u1ED3 s\u01A1 c\u1EA5u h\xECnh WebClip (.mobileconfig)</strong> ho\u1EB7c t\xEDnh n\u0103ng <strong>Th\xEAm v\xE0o M\xE0n h\xECnh ch\xEDnh</strong> c\u1EE7a Safari. \u1EE8ng d\u1EE5ng s\u1EBD m\u1EDF \u1EDF ch\u1EBF \u0111\u1ED9 To\xE0n m\xE0n h\xECnh (FullScreen) nh\u01B0 App Native!
        </p>
      </div>

      <!-- T\xD9Y CH\u1ECCN 1: T\u1EA2I FILE .MOBILECONFIG (APPLE WEBCLIP PROFILE) -->
      <div class="p-4 rounded-2xl border-2 border-dashed border-brand-300 dark:border-brand-800 bg-white dark:bg-slate-800 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs font-black uppercase text-brand-600 dark:text-brand-400">C\xE1ch 1: T\u1EA3i file c\u1EA5u h\xECnh iOS (.mobileconfig)</span>
          <span class="text-[10px] bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold px-2 py-0.5 rounded-full">Khuy\xEAn d\xF9ng</span>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          T\u1EA3i h\u1ED3 s\u01A1 c\u1EA5u h\xECnh Apple WebClip ch\xEDnh th\u1EE9c c\u1EE7a To-Do List \u0111\xE3 nh\xFAng s\u1EB5n icon s\u1EAFc n\xE9t.
        </p>
        <a href="/api/download/ios-profile" download="todolist.mobileconfig"
           class="w-full py-3 px-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          T\u1EA3i h\u1ED3 s\u01A1 c\xE0i \u0111\u1EB7t (.mobileconfig)
        </a>
        <div class="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
          <p class="font-bold text-slate-700 dark:text-slate-200">C\xE1c b\u01B0\u1EDBc sau khi b\u1EA5m T\u1EA3i:</p>
          <p>1. Safari h\u1ECFi t\u1EA3i h\u1ED3 s\u01A1 &gt; b\u1EA5m <strong>Cho ph\xE9p (Allow)</strong>.</p>
          <p>2. M\u1EDF <strong>C\xE0i \u0111\u1EB7t (Settings)</strong> tr\xEAn iPhone &gt; b\u1EA5m v\xE0o m\u1EE5c <strong>"\u0110\xE3 t\u1EA3i v\u1EC1 h\u1ED3 s\u01A1" (Profile Downloaded)</strong> \u1EDF tr\xEAn c\xF9ng.</p>
          <p>3. B\u1EA5m <strong>C\xE0i \u0111\u1EB7t (Install)</strong> \u1EDF g\xF3c ph\u1EA3i tr\xEAn c\xF9ng &gt; Bi\u1EC3u t\u01B0\u1EE3ng App To-Do List s\u1EBD xu\u1EA5t hi\u1EC7n ngay tr\xEAn m\xE0n h\xECnh ch\xEDnh!</p>
        </div>
      </div>

      <!-- T\xD9Y CH\u1ECCN 2: TH\xCAM QUA SAFARI -->
      <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
        <p class="font-bold text-slate-800 dark:text-slate-200">C\xE1ch 2: Th\xEAm tr\u1EF1c ti\u1EBFp t\u1EEB tr\xECnh duy\u1EC7t Safari:</p>
        <p>1. M\u1EDF trang web n\xE0y trong tr\xECnh duy\u1EC7t <strong>Safari</strong> tr\xEAn iPhone.</p>
        <p>2. B\u1EA5m v\xE0o n\xFAt <strong>Chia s\u1EBB (Share)</strong> \u2014 bi\u1EC3u t\u01B0\u1EE3ng \xF4 vu\xF4ng c\xF3 m\u0169i t\xEAn ch\u1EC9 l\xEAn \u1EDF thanh \u0111\xE1y Safari.</p>
        <p>3. Cu\u1ED9n xu\u1ED1ng v\xE0 ch\u1ECDn <strong>"Th\xEAm v\xE0o M\xE0n h\xECnh ch\xEDnh" (Add to Home Screen)</strong> &gt; B\u1EA5m <strong>Th\xEAm (Add)</strong>.</p>
      </div>
    </div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550 CREATE / EDIT MODAL \u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div x-show="showModal" x-cloak class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4"
     x-transition:enter="transition ease-out duration-200" x-transition:enter-start="opacity-0 translate-y-8 sm:translate-y-0" x-transition:enter-end="opacity-100 translate-y-0"
     x-transition:leave="transition ease-in duration-150" x-transition:leave-start="opacity-100 translate-y-0" x-transition:leave-end="opacity-0 translate-y-8 sm:translate-y-0">
  
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showModal=false"></div>

  <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 max-h-[90vh] overflow-y-auto"
       @click.stop>
    
    <div class="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden"></div>

    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white" x-text="editingTodo ? 'Ch\u1EC9nh s\u1EEDa c\xF4ng vi\u1EC7c' : 'T\u1EA1o c\xF4ng vi\u1EC7c m\u1EDBi'"></h2>
      <button @click="showModal=false" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <form @submit.prevent="saveTodo()" class="space-y-4">
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Ti\xEAu \u0111\u1EC1 c\xF4ng vi\u1EC7c <span class="text-rose-500">*</span></label>
        <input x-model="todoForm.title" type="text" required placeholder="Nh\u1EADp vi\u1EC7c c\u1EA7n l\xE0m..."
               class="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm font-semibold" />
      </div>

      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Ghi ch\xFA chi ti\u1EBFt</label>
        <textarea x-model="todoForm.description" rows="2" placeholder="Chi ti\u1EBFt ho\u1EB7c \u0111\u01B0\u1EDDng link li\xEAn quan..."
                  class="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition text-sm resize-none"></textarea>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Danh m\u1EE5c</label>
            <button type="button" @click="customCategoryMode = !customCategoryMode" class="text-[11px] text-brand-600 dark:text-brand-400 font-bold hover:underline">
              <span x-text="customCategoryMode ? 'Ch\u1ECDn s\u1EB5n' : '+ T\u1EA1o m\u1EDBi'"></span>
            </button>
          </div>
          <div x-show="!customCategoryMode">
            <select x-model="todoForm.category"
                    class="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold outline-none cursor-pointer">
              <template x-for="cat in categories" :key="cat">
                <option :value="cat" x-text="cat"></option>
              </template>
            </select>
          </div>
          <div x-show="customCategoryMode">
            <input x-model="todoForm.category" type="text" placeholder="Nh\u1EADp danh m\u1EE5c m\u1EDBi..."
                   class="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold outline-none" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">M\u1EE9c \u0111\u1ED9 \u01B0u ti\xEAn</label>
          <select x-model="todoForm.priority"
                  class="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold outline-none cursor-pointer">
            <option value="Low">\u{1F7E2} Th\u1EA5p (Low)</option>
            <option value="Medium">\u{1F7E1} B\xECnh th\u01B0\u1EDDng (Medium)</option>
            <option value="High">\u{1F534} Kh\u1EA9n c\u1EA5p (High)</option>
          </select>
        </div>
      </div>

      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">H\u1EA1n ch\xF3t (Due Date)</label>
          <button type="button" x-show="todoForm.due_date" @click="todoForm.due_date=''" class="text-[11px] text-rose-500 font-bold hover:underline">
            X\xF3a h\u1EA1n ch\xF3t
          </button>
        </div>
        <input x-model="todoForm.due_date" type="datetime-local"
               class="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold outline-none mb-2" />
        
        <div class="flex flex-wrap gap-1.5">
          <button type="button" @click="setQuickDate('today-18')" class="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition">H\xF4m nay 18:00</button>
          <button type="button" @click="setQuickDate('today-21')" class="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition">T\u1ED1i nay 21:00</button>
          <button type="button" @click="setQuickDate('tomorrow-09')" class="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition">S\xE1ng mai 09:00</button>
          <button type="button" @click="setQuickDate('weekend')" class="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition">Cu\u1ED1i tu\u1EA7n (Th\u1EE9 7)</button>
        </div>
      </div>

      <div class="flex items-center gap-2 pt-1">
        <input type="checkbox" id="pinCheck" x-model="todoForm.is_pinned" class="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer" />
        <label for="pinCheck" class="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14l-2-7V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v6L5 17z"/></svg>
          Ghim c\xF4ng vi\u1EC7c n\xE0y l\xEAn \u0111\u1EA7u danh s\xE1ch
        </label>
      </div>

      <div class="flex gap-2.5 pt-2">
        <button type="button" @click="showModal=false"
                class="flex-1 py-3 px-4 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm">
          Hu\u1EF7
        </button>
        <button type="submit" :disabled="todoSaving"
                class="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 transition disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
          <svg x-show="todoSaving" class="spinner w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round"/></svg>
          <span x-text="editingTodo ? 'C\u1EADp nh\u1EADt' : 'T\u1EA1o vi\u1EC7c m\u1EDBi'"></span>
        </button>
      </div>
    </form>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550 CONFIRM DELETE MODAL \u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div x-show="showDeleteModal" x-cloak class="fixed inset-0 z-[110] flex items-center justify-center p-4">
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showDeleteModal=false"></div>
  <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center" @click.stop>
    <div class="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center mb-3">
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
    </div>
    <h3 class="text-base font-bold mb-1.5">X\xE1c nh\u1EADn xo\xE1 c\xF4ng vi\u1EC7c?</h3>
    <p class="text-xs text-slate-500 dark:text-slate-400 mb-5">
      B\u1EA1n c\xF3 ch\u1EAFc ch\u1EAFn mu\u1ED1n xo\xE1 "<strong x-text="deletingTodo?.title" class="text-slate-800 dark:text-slate-200"></strong>"? H\xE0nh \u0111\u1ED9ng n\xE0y kh\xF4ng th\u1EC3 ho\xE0n t\xE1c.
    </p>
    <div class="flex gap-2.5">
      <button @click="showDeleteModal=false" class="flex-1 py-2.5 px-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs">Hu\u1EF7</button>
      <button @click="deleteTodo()" :disabled="todoSaving" class="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs">Xo\xE1 v\u0129nh vi\u1EC5n</button>
    </div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550 CONFIRM CLEAR COMPLETED MODAL \u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<div x-show="showClearCompletedModal" x-cloak class="fixed inset-0 z-[110] flex items-center justify-center p-4">
  <div class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" @click="showClearCompletedModal=false"></div>
  <div class="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center" @click.stop>
    <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center mb-3">
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
    </div>
    <h3 class="text-base font-bold mb-1.5">D\u1ECDn d\u1EB9p c\xF4ng vi\u1EC7c \u0111\xE3 xong?</h3>
    <p class="text-xs text-slate-500 dark:text-slate-400 mb-5">
      T\u1EA5t c\u1EA3 <strong x-text="stats.completed" class="text-rose-500"></strong> vi\u1EC7c \u0111\xE3 ho\xE0n t\u1EA5t s\u1EBD b\u1ECB d\u1ECDn d\u1EB9p kh\u1ECFi danh s\xE1ch.
    </p>
    <div class="flex gap-2.5">
      <button @click="showClearCompletedModal=false" class="flex-1 py-2.5 px-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs">Hu\u1EF7</button>
      <button @click="clearCompleted()" :disabled="todoSaving" class="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs">D\u1ECDn d\u1EB9p ngay</button>
    </div>
  </div>
</div>

<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550 JAVASCRIPT CONTROLLER \u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<script>
function app() {
  return {
    darkMode: localStorage.getItem('darkMode') === 'true',
    authenticated: false,
    currentUser: null,
    authMode: 'login',
    authForm: { email: '', username: '', password: '' },
    authLoading: false,

    todos: [],
    todosLoading: false,
    categories: ['Personal', 'Work', 'Shopping', 'Health', 'Study'],

    // Filters
    searchQuery: '',
    filterStatus: 'all',
    filterCategory: 'all',
    filterPriority: 'all',
    sortBy: 'due_date-asc',

    statusFilters: [
      {
        value: 'all',
        label: 'T\u1EA5t c\u1EA3',
        icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
      },
      {
        value: 'pending',
        label: '\u0110ang ch\u1EDD',
        icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
      },
      {
        value: 'completed',
        label: '\u0110\xE3 xong',
        icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
      },
      {
        value: 'overdue',
        label: 'Qu\xE1 h\u1EA1n',
        icon: '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
      }
    ],

    // Modals
    showModal: false,
    editingTodo: null,
    customCategoryMode: false,
    todoForm: { title:'', description:'', category:'Personal', priority:'Medium', due_date:'', is_pinned: false },
    todoSaving: false,

    showDeleteModal: false,
    deletingTodo: null,
    showClearCompletedModal: false,

    // Download Modal State
    showDownloadModal: false,
    downloadTab: 'pc',
    deferredInstallPrompt: null,

    // Toasts
    toasts: [],
    toastId: 0,

    // Notifications & Service Worker
    notificationsEnabled: localStorage.getItem('notificationsEnabled') === 'true',
    notifiedTasks: new Set(),
    reminderInterval: null,
    swRegistration: null,

    get stats() {
      const total = this.todos.length;
      const completed = this.todos.filter(t => t.is_completed).length;
      const pending = this.todos.filter(t => !t.is_completed).length;
      const overdue = this.todos.filter(t => this.isOverdue(t)).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { total, completed, pending, overdue, percent };
    },

    get imminentTodos() {
      return this.todos.filter(t => this.isWithin30Minutes(t));
    },

    async init() {
      // 1. \u0110\u0103ng k\xFD Service Worker
      if ('serviceWorker' in navigator) {
        try {
          this.swRegistration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered successfully');
        } catch (e) {
          console.warn('Service Worker registration failed:', e);
        }
      }

      // 2. B\u1EAFt s\u1EF1 ki\u1EC7n PWA Install c\u1EE7a tr\xECnh duy\u1EC7t
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredInstallPrompt = e;
      });

      await this.checkAuth();

      // 3. Qu\xE9t th\xF4ng b\xE1o 30 ph\xFAt \u0111\u1ECBnh k\u1EF3
      this.reminderInterval = setInterval(() => {
        this.checkDueReminders();
      }, 20000);
    },

    // \u2500\u2500 C\xE0i \u0111\u1EB7t PWA 1-Click cho PC \u2500\u2500
    async installPWA() {
      if (this.deferredInstallPrompt) {
        this.deferredInstallPrompt.prompt();
        const { outcome } = await this.deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          this.showToast('C\xE0i \u0111\u1EB7t \u1EE9ng d\u1EE5ng th\xE0nh c\xF4ng! \u{1F389}', 'success');
          this.showDownloadModal = false;
        }
        this.deferredInstallPrompt = null;
      } else {
        this.showToast('Vui l\xF2ng b\u1EA5m bi\u1EC3u t\u01B0\u1EE3ng C\xE0i \u0111\u1EB7t tr\xEAn thanh \u0111\u1ECBa ch\u1EC9 tr\xECnh duy\u1EC7t!', 'info');
      }
    },

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      localStorage.setItem('darkMode', this.darkMode);
    },

    showToast(message, type = 'success') {
      const id = ++this.toastId;
      this.toasts.push({ id, message, type });
      setTimeout(() => {
        this.removeToast(id);
      }, 4000);
    },

    removeToast(id) {
      this.toasts = this.toasts.filter(t => t.id !== id);
    },

    playChime() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.45);
      } catch {}
    },

    async toggleNotificationPermission() {
      if (!('Notification' in window)) {
        this.showToast('Tr\xECnh duy\u1EC7t kh\xF4ng h\u1ED7 tr\u1EE3 th\xF4ng b\xE1o.', 'error');
        return;
      }

      if (Notification.permission === 'granted') {
        this.notificationsEnabled = !this.notificationsEnabled;
        localStorage.setItem('notificationsEnabled', this.notificationsEnabled);
        this.showToast(this.notificationsEnabled ? '\u0110\xE3 b\u1EADt nh\u1EAFc nh\u1EDF tr\u01B0\u1EDBc 30 ph\xFAt!' : '\u0110\xE3 t\u1EAFt nh\u1EAFc nh\u1EDF.', 'info');
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          this.notificationsEnabled = true;
          localStorage.setItem('notificationsEnabled', true);
          this.showToast('\u0110\xE3 c\u1EA5p quy\u1EC1n th\xF4ng b\xE1o th\xE0nh c\xF4ng!', 'success');
          this.triggerSystemNotification(
            '\u23F0 To-Do List \u0111\xE3 b\u1EADt th\xF4ng b\xE1o',
            'B\u1EA1n s\u1EBD nh\u1EADn \u0111\u01B0\u1EE3c th\xF4ng b\xE1o tr\u01B0\u1EDBc 30 ph\xFAt khi c\xF3 vi\u1EC7c s\u1EAFp h\u1EBFt h\u1EA1n!',
            'welcome-notification'
          );
        } else {
          this.showToast('B\u1EA1n \u0111\xE3 t\u1EEB ch\u1ED1i quy\u1EC1n th\xF4ng b\xE1o.', 'warning');
        }
      } else {
        this.showToast('Vui l\xF2ng b\u1EADt quy\u1EC1n th\xF4ng b\xE1o trong c\xE0i \u0111\u1EB7t tr\xECnh duy\u1EC7t.', 'warning');
      }
    },

    // \u2500\u2500 PH\xC1T TH\xD4NG B\xC1O H\u1EC6 TH\u1ED0NG V\u1EDAI \u1EA2NH PNG TH\u1EACT (KH\xD4NG B\u1ECA C\u1EE4C XANH) \u2500\u2500
    triggerSystemNotification(title, body, tag) {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const iconUrl = window.location.origin + '/icon-192.png';

      // \u01AFu ti\xEAn ph\xE1t qua Service Worker Registration (hi\u1EC7n t\xEAn app To-Do List khi c\xE0i PWA)
      if (this.swRegistration && this.swRegistration.showNotification) {
        this.swRegistration.showNotification(title, {
          body: body,
          icon: iconUrl,
          badge: iconUrl,
          tag: tag || 'todo-reminder',
          renotify: true,
          vibrate: [200, 100, 200],
          data: { url: '/' }
        }).catch(() => {
          // Fallback n\u1EBFu SW b\u1EADn
          new Notification(title, { body, icon: iconUrl, tag: tag || 'todo-reminder' });
        });
      } else {
        new Notification(title, { body, icon: iconUrl, tag: tag || 'todo-reminder' });
      }
    },

    checkDueReminders() {
      if (this.todos.length === 0) return;
      const now = Date.now();

      this.todos.forEach(todo => {
        if (todo.is_completed || !todo.due_date) return;
        const d = this.parseDateSafe(todo.due_date);
        if (!d) return;

        const timeLeftMs = d.getTime() - now;
        const minutesLeft = Math.floor(timeLeftMs / (60 * 1000));

        if (minutesLeft > 0 && minutesLeft <= 30 && !this.notifiedTasks.has(todo.id)) {
          this.notifiedTasks.add(todo.id);
          this.playChime();

          // In-App Toast
          this.showToast('\u23F0 Vi\u1EC7c "' + todo.title + '" s\u1EAFp h\u1EBFt h\u1EA1n trong ' + minutesLeft + ' ph\xFAt!', 'warning');

          // System Notification v\u1EDBi Logo PNG th\u1EADt
          if (this.notificationsEnabled) {
            this.triggerSystemNotification(
              '\u23F0 S\u1EAFp h\u1EBFt h\u1EA1n trong ' + minutesLeft + ' ph\xFAt!',
              'C\xF4ng vi\u1EC7c "' + todo.title + '" c\u1EA7n ho\xE0n th\xE0nh tr\u01B0\u1EDBc ' + d.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' }),
              'reminder-' + todo.id
            );
          }
        }
      });
    },

    isWithin30Minutes(todo) {
      if (!todo.due_date || todo.is_completed) return false;
      const d = this.parseDateSafe(todo.due_date);
      if (!d) return false;
      const diffMs = d.getTime() - Date.now();
      return diffMs > 0 && diffMs <= 30 * 60 * 1000;
    },

    async api(url, options = {}) {
      const res = await fetch(url, {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'C\xF3 l\u1ED7i x\u1EA3y ra.');
      }
      return data;
    },

    parseDateSafe(dateStr) {
      if (!dateStr) return null;
      let s = String(dateStr).trim();
      if (s.length >= 19 && s.indexOf('T') === -1 && s.indexOf(' ') !== -1) {
        s = s.replace(' ', 'T');
      }
      if (!s.endsWith('Z') && s.includes('T') && s.length >= 19) {
        s = s + 'Z';
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    },

    isOverdue(todo) {
      if (!todo.due_date || todo.is_completed) return false;
      const d = this.parseDateSafe(todo.due_date);
      if (!d) return false;
      return d.getTime() < Date.now();
    },

    formatDateDisplay(dateStr) {
      const d = this.parseDateSafe(dateStr);
      if (!d) return '';

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const startOfTarget = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const diffDays = Math.round((startOfTarget - startOfToday) / (24 * 3600 * 1000));

      const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const dateFormatted = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

      if (diffDays === 0) {
        return 'H\xF4m nay, ' + timeStr;
      } else if (diffDays === 1) {
        return 'Ng\xE0y mai, ' + timeStr;
      } else if (diffDays === -1) {
        return 'H\xF4m qua, ' + timeStr;
      } else if (diffDays > 1 && diffDays <= 7) {
        return diffDays + ' ng\xE0y n\u1EEFa (' + timeStr + ')';
      } else if (diffDays < -1 && diffDays >= -7) {
        return Math.abs(diffDays) + ' ng\xE0y tr\u01B0\u1EDBc';
      }
      return dateFormatted + ' ' + timeStr;
    },

    toLocalDatetimeInput(dateStr) {
      const d = this.parseDateSafe(dateStr);
      if (!d) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    },

    setQuickDate(type) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const format = (d, h, m) => {
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(h) + ':' + pad(m);
      };

      if (type === 'today-18') {
        this.todoForm.due_date = format(now, 18, 0);
      } else if (type === 'today-21') {
        this.todoForm.due_date = format(now, 21, 0);
      } else if (type === 'tomorrow-09') {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.todoForm.due_date = format(tomorrow, 9, 0);
      } else if (type === 'weekend') {
        const weekend = new Date(now);
        const day = weekend.getDay();
        const diff = (6 - day + 7) % 7 || 7;
        weekend.setDate(weekend.getDate() + diff);
        this.todoForm.due_date = format(weekend, 12, 0);
      }
    },

    async checkAuth() {
      try {
        const data = await this.api('/api/auth/me');
        if (data.authenticated) {
          this.authenticated = true;
          this.currentUser = data.user;
          await this.fetchCategories();
          await this.fetchTodos();
        }
      } catch {}
    },

    async handleAuth() {
      this.authLoading = true;
      try {
        const url = this.authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const body = this.authMode === 'login'
          ? { email: this.authForm.email, password: this.authForm.password }
          : { ...this.authForm };

        const data = await this.api(url, { method: 'POST', body: JSON.stringify(body) });
        this.authenticated = true;
        this.currentUser = data.user;
        this.showToast(this.authMode === 'login' ? '\u0110\u0103ng nh\u1EADp th\xE0nh c\xF4ng!' : 'T\u1EA1o t\xE0i kho\u1EA3n th\xE0nh c\xF4ng!');
        this.authForm = { email: '', username: '', password: '' };
        await this.fetchCategories();
        await this.fetchTodos();
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        this.authLoading = false;
      }
    },

    async logout() {
      try {
        await this.api('/api/auth/logout', { method: 'POST' });
      } catch {}
      this.authenticated = false;
      this.currentUser = null;
      this.todos = [];
      this.showToast('\u0110\xE3 \u0111\u0103ng xu\u1EA5t an to\xE0n.', 'info');
    },

    async fetchTodos() {
      this.todosLoading = true;
      try {
        const [sort, order] = this.sortBy.split('-');
        const params = new URLSearchParams();
        if (this.filterStatus !== 'all') params.set('status', this.filterStatus);
        if (this.filterCategory !== 'all') params.set('category', this.filterCategory);
        if (this.filterPriority !== 'all') params.set('priority', this.filterPriority);
        if (this.searchQuery) params.set('search', this.searchQuery);
        params.set('sort', sort);
        params.set('order', order);

        const data = await this.api('/api/todos?' + params.toString());
        this.todos = data.todos;
        this.checkDueReminders();
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        this.todosLoading = false;
      }
    },

    async fetchCategories() {
      try {
        const data = await this.api('/api/categories');
        this.categories = data.categories;
      } catch {}
    },

    openCreateModal() {
      this.editingTodo = null;
      this.customCategoryMode = false;
      this.todoForm = {
        title: '',
        description: '',
        category: 'Personal',
        priority: 'Medium',
        due_date: '',
        is_pinned: false
      };
      this.showModal = true;
    },

    openEditModal(todo) {
      this.editingTodo = todo;
      this.customCategoryMode = false;
      this.todoForm = {
        title: todo.title,
        description: todo.description || '',
        category: todo.category,
        priority: todo.priority,
        due_date: this.toLocalDatetimeInput(todo.due_date),
        is_pinned: Boolean(todo.is_pinned)
      };
      this.showModal = true;
    },

    async saveTodo() {
      this.todoSaving = true;
      try {
        let dueDateISO = null;
        if (this.todoForm.due_date) {
          const d = new Date(this.todoForm.due_date);
          if (!isNaN(d.getTime())) {
            dueDateISO = d.toISOString();
          }
        }

        const body = {
          title: this.todoForm.title,
          description: this.todoForm.description,
          category: this.todoForm.category,
          priority: this.todoForm.priority,
          due_date: dueDateISO,
          is_pinned: this.todoForm.is_pinned ? 1 : 0
        };

        if (this.editingTodo) {
          await this.api('/api/todos/' + this.editingTodo.id, { method: 'PUT', body: JSON.stringify(body) });
          this.showToast('\u0110\xE3 c\u1EADp nh\u1EADt c\xF4ng vi\u1EC7c!');
        } else {
          await this.api('/api/todos', { method: 'POST', body: JSON.stringify(body) });
          this.showToast('\u0110\xE3 t\u1EA1o c\xF4ng vi\u1EC7c m\u1EDBi!');
        }
        this.showModal = false;
        await this.fetchTodos();
        await this.fetchCategories();
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        this.todoSaving = false;
      }
    },

    async toggleTodo(todo) {
      try {
        await this.api('/api/todos/' + todo.id + '/toggle', { method: 'PATCH' });
        todo.is_completed = todo.is_completed ? 0 : 1;
        this.showToast(todo.is_completed ? 'Ho\xE0n th\xE0nh xu\u1EA5t s\u1EAFc! \u{1F389}' : '\u0110\xE3 chuy\u1EC3n sang \u0111ang ch\u1EDD.', 'info');
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    async togglePin(todo) {
      try {
        await this.api('/api/todos/' + todo.id + '/pin', { method: 'PATCH' });
        todo.is_pinned = todo.is_pinned ? 0 : 1;
        this.showToast(todo.is_pinned ? '\u{1F4CC} \u0110\xE3 ghim l\xEAn \u0111\u1EA7u' : '\u0110\xE3 b\u1ECF ghim', 'info');
        await this.fetchTodos();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    async duplicateTodo(todo) {
      try {
        const body = {
          title: todo.title + ' (B\u1EA3n sao)',
          description: todo.description || '',
          category: todo.category,
          priority: todo.priority,
          due_date: todo.due_date,
          is_pinned: 0
        };
        await this.api('/api/todos', { method: 'POST', body: JSON.stringify(body) });
        this.showToast('\u0110\xE3 nh\xE2n b\u1EA3n c\xF4ng vi\u1EC7c!');
        await this.fetchTodos();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    },

    confirmDelete(todo) {
      this.deletingTodo = todo;
      this.showDeleteModal = true;
    },

    async deleteTodo() {
      this.todoSaving = true;
      try {
        await this.api('/api/todos/' + this.deletingTodo.id, { method: 'DELETE' });
        this.showToast('\u0110\xE3 xo\xE1 c\xF4ng vi\u1EC7c!');
        this.showDeleteModal = false;
        this.deletingTodo = null;
        await this.fetchTodos();
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        this.todoSaving = false;
      }
    },

    confirmClearCompleted() {
      this.showClearCompletedModal = true;
    },

    async clearCompleted() {
      this.todoSaving = true;
      try {
        await this.api('/api/todos/clear-completed', { method: 'POST' });
        this.showToast('\u0110\xE3 d\u1ECDn d\u1EB9p t\u1EA5t c\u1EA3 vi\u1EC7c \u0111\xE3 ho\xE0n th\xE0nh!');
        this.showClearCompletedModal = false;
        await this.fetchTodos();
      } catch (err) {
        this.showToast(err.message, 'error');
      } finally {
        this.todoSaving = false;
      }
    },

    exportTodos() {
      if (this.todos.length === 0) {
        this.showToast('Kh\xF4ng c\xF3 c\xF4ng vi\u1EC7c n\xE0o \u0111\u1EC3 xu\u1EA5t d\u1EEF li\u1EC7u!', 'info');
        return;
      }
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.todos, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', 'todos_backup_' + new Date().toISOString().slice(0, 10) + '.json');
      document.body.appendChild(a);
      a.click();
      a.remove();
      this.showToast('\u0110\xE3 t\u1EA3i xu\u1ED1ng file sao l\u01B0u!');
    }
  };
}
<\/script>

</body>
</html>`
  );
}
__name(renderHTML, "renderHTML");

// src/icon.ts
var ICON_192_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAIOUlEQVR4nO3d6XYURRiH8VwJJJBAFsANFbgKQUQRUYSEiCiiiCgieJuKO2TccYPP7Znu1PTUVHXN1stb9T7/c947+D2fpuvMwkLLO373cTZ8x/L7Lzv2ReDu2PfinX/t+zxwt4t74fY/7n0Wvuc//bv6bvnv6K2/sqOfjLmb9j1381F5H4+5G4+yZ2/86b+Pqu+ZD/8I33X3nr7+e3EfjLlr5T117Tf73g/ce/37NTsycm2brH3H7z3OrLvrP/CDfxT/4K76r2vblXPQgx/8NeM/fPWX7PC75XVtPt+Je0/88MEP/gbxdx7CiS+fZOAHf9f487tSHPjBrxZ/KxHk8MEPfqH4+3foys/5gR/8avHn906NEYAf/LHhNwd+8KuFP3cE4Ad/7PhnjgD84E8F/6Ht4qYPAPzgTwT/VAGAH/yp4d/Y7uUHfvCrxT9RBOAHf8r4gwGAH/yp49+4XJw3APCDXwN+bwDgB78W/N4IwA9+TfjHBwB+8CeM3woA/ODXhn9jq5etb+1kbgDgB78S/G4A4Ae/Ivx2AOAHvzL8ZQDgB79C/MEAwA/+1PFXBgB+8GvAv765k4Ef/GrxOwGAH/ya8FsBgB/82vAPAgA/+DXizwMAP/i14t8NAPzg14m/CAD84FeKf23zYSAA8IM/cfxrl6oCAD/4FeD3BwB+8CvB7wYAfvArwm8HAH7wK8NfBgB+8CvEXwQAfvArxe8EAH7wa8K/dnEoAPCDXxv+QQDgB79G/HkA4Ae/VvxuAOAHvyL8qxcfDAUAfvArw18GAH7wK8RfBAB+8CvFHw4A/OBPHP/q21UBgB/8CvD7AwA/+CfA31/s+N0AwA9+D/5pFhN+OwDwg38E/zyLAX8ZAPjBXyP+YASC8BcBgB/8DeD3RiAM/yAA8IO/CfxWBALxr154kC2AH/xN4jeTiN8fAPjB31YEHeM/eOGnkQDAD/62AhCA3w4A/OBvKwIh+MsAwK8S/7Q/ctUSgCD8RQDgB7+AALrAPzYA8IO/jQC6wn/wrUAA4Ad/GwF0ib8yAPCDv8lJwe8NAPzgb3KS8DsBgB/8TU8SfisA8KeLX1IAkvAPAgA/+NuaJPx5AOAHf5uThD8cAPjBX/Ok4T/w5o8VAYAf/A1MGn5/AOAHfwOTiN8NAPzR45cYgFT8dgDgB38Dk4y/DAD84G9okvEXAYAf/A1NOv7KAMAP/nkXA/4D5z0BgB/88y4W/E4A4Af/vIsJvxUA+OPCLzGA2PAPAgA/+OddjPjzAFLF3x/421uM+IsAEsA/zcBf/2LFv3L+hzEBCMc/z8Bfz2LGv/JGKICE8ZuBf77Fjr86AAX4zcA/21LA7w9AEX4zyfglBpAKfjcAhfjNwD/ZUsJvB6AYvxn4xy8l/GUAwvG3FUB/4K9eaviLAMDvDPzuUsTvBCARfxcBZKMRgD9J/CvnhgKQir//aUNXaxu/xABSxj8IQDL+LgPoD/zp4s8DkI7ffNjW5TTiz0wACeO3AwB/cOBPD//yue93AxCK35yUgT8t/EUAwvFLCiCrigD8UeIfH4AA/NICyEYjAH+0+JdfDwUgBL/oAGbELzEAjfirAxCEX2IA/YE/fvz+AIThN294JS4F/P1pxe8GIBTB+M0DdqkDf5z4ywAiwG9O6sAfH/4igIjwmwfsUucNYFteAOAfCiA2/OakDvzx4F8+WxWAcPxRRCAQfzYSgHb8+89+5wkgEvzSI5A48Nv43QAiw99/wM4mG/hd/HYAEeI3D9hZeOD34y8DiBj/ESIIDvzV+IsAEsBPBM6CP/xgALHhNw/YWTHwj8e//7WKAHLFb45l4J8AvzeA2PETAfgnxe8EkAp+84Bd48A/OX4rgNTwm1dbmgb+6fAPAkglv6YIwD89/jyA1PFrigD8s+EfH0Ai+M0D9hQH/tnx73v120AAieE3l9rAPzv+6gASxZ9aBOCfD78/gMTxm/e7sQ/88+N3A1CC3zxgj3Xgrwe/HYAy/JIfrocG/vrwlwEoxR9bAOCvF38RgGL8sUUA/nrxewPQhl/yA/bhgb9+/PvOjASgFb85qQN/M/itALTD39ju5Sdt4G8O/yAA8PeskzLwN4s/DwD8PfcuNx8B+JvHXwYAfgu/OfCnjX/pzDfZAvj9+LuMAPzt4B8fgHL8XUQA/vbwL70SCgD8xW31svWtHfAniL86APBb+M2BPy38/gDA78XfZATg7wa/G4D4g/jz26w3AvB3h98OAPwT4TcH/vjxlwGAfyr8dUQA/u7xFwGAfyb85tY2H84OH/yd4rcDAP9s+Ncu+S/jD+nE4186vRsA+OvFnx/4xePPAwA/+LXidwMAP/gV4V88fX8oAPCDXxv+MgDwg18h/iIA8INfKf5wAOAHf+L4F1+uCgD84FeA3x8A+MGvBL8bAPjBrwi/HQD4wa8MfxkA+MGvEH8RAPjBrxT/bgDgB79O/Iun7mcL4Ae/VvzVAYAf/Arw7z31tScA8INfCX43APCDXxH+PID+wA9+jfjLAMAPfoX4gwGAH/yp468MAPzg14B/70lPAOAHvxb8TgDgB78m/FYA4Ae/NvyDAPoDP/jV4g8GAH7wJ4h/sgDAD/5E8TsBOBGAH/ya8FsBgB/8CePfc/IrfwB5BOAHv1b8vgDAD/6U8O95aUwAwxGAH/zq8JuBH/xq8VsBgB/8CeCfOoA8AvCDXyv+YATgB78G/N4IwA9+TfitCMAPfo34BxGAH/xa8Q8P/OCXiv9R+N4IwA9+bfitEMAPfsm/9rQ18INfxCfNEgZ+8LfyjLGG/Q8sn2NSvjdSjwAAAABJRU5ErkJggg==";
function getIconPNGBytes() {
  const binary = atob(ICON_192_PNG_BASE64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
__name(getIconPNGBytes, "getIconPNGBytes");

// src/sw.ts
function renderServiceWorker() {
  return (
    /*javascript*/
    `
const CACHE_NAME = 'todolist-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png'
];

// C\xE0i \u0111\u1EB7t Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// K\xEDch ho\u1EA1t Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// L\u1EAFng nghe s\u1EF1 ki\u1EC7n Fetch (h\u1ED7 tr\u1EE3 offline nh\u1EB9)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return; // Kh\xF4ng cache API

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => caches.match('/'));
    })
  );
});

// \u2500\u2500\u2500 HI\u1EC2N TH\u1ECA TH\xD4NG B\xC1O T\u1EEA TRANG WEB QUA SERVICE WORKER \u2500\u2500\u2500
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data;
    self.registration.showNotification(title || 'To-Do List', {
      body: body || 'B\u1EA1n c\xF3 c\xF4ng vi\u1EC7c c\u1EA7n ho\xE0n th\xE0nh!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: tag || 'todo-reminder',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: '/' }
    });
  }
});

// \u2500\u2500\u2500 L\u1EAENG NGHE WEB PUSH NOTIFICATION KHI T\u1EAET TR\xCCNH DUY\u1EC6T \u2500\u2500\u2500
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'To-Do List', body: event.data.text() };
    }
  }

  const title = data.title || 'To-Do List';
  const options = {
    body: data.body || 'Nh\u1EAFc nh\u1EDF c\xF4ng vi\u1EC7c s\u1EAFp \u0111\u1EBFn h\u1EA1n!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'todo-push',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// \u2500\u2500\u2500 X\u1EEC L\xDD KHI NG\u01AF\u1EDCI D\xD9NG B\u1EA4M V\xC0O TH\xD4NG B\xC1O \u2500\u2500\u2500
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
`
  );
}
__name(renderServiceWorker, "renderServiceWorker");

// src/iosProfile.ts
function generateIOSMobileConfig(appUrl) {
  const cleanUrl = appUrl.endsWith("/") ? appUrl : appUrl + "/";
  const profileUUID = crypto.randomUUID().toUpperCase();
  const webClipUUID = crypto.randomUUID().toUpperCase();
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>ConsentText</key>
    <dict>
        <key>default</key>
        <string>H\u1ED3 s\u01A1 n\xE0y s\u1EBD c\xE0i \u0111\u1EB7t bi\u1EC3u t\u01B0\u1EE3ng \u1EE9ng d\u1EE5ng To-Do List l\xEAn M\xE0n h\xECnh ch\xEDnh c\u1EE7a b\u1EA1n v\u1EDBi ch\u1EBF \u0111\u1ED9 To\xE0n m\xE0n h\xECnh (Standalone App).</string>
    </dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>Icon</key>
            <data>
${ICON_192_PNG_BASE64}
            </data>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>To-Do List</string>
            <key>PayloadDescription</key>
            <string>C\xE0i \u0111\u1EB7t \u1EE9ng d\u1EE5ng web To-Do List</string>
            <key>PayloadDisplayName</key>
            <string>To-Do List</string>
            <key>PayloadIdentifier</key>
            <string>com.todolist.app.webclip.${webClipUUID}</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>${webClipUUID}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${cleanUrl}</string>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>C\xE0i \u0111\u1EB7t bi\u1EC3u t\u01B0\u1EE3ng \u1EE9ng d\u1EE5ng To-Do List l\xEAn M\xE0n h\xECnh ch\xEDnh iPhone/iPad</string>
    <key>PayloadDisplayName</key>
    <string>To-Do List</string>
    <key>PayloadIdentifier</key>
    <string>com.todolist.app.profile.${profileUUID}</string>
    <key>PayloadOrganization</key>
    <string>To-Do List</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${profileUUID}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;
}
__name(generateIOSMobileConfig, "generateIOSMobileConfig");

// src/index.ts
var app = new Hono3();
app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("X-XSS-Protection", "1; mode=block");
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
});
app.use("/api/*", cors({
  origin: "*",
  credentials: true
}));
var dbMigrated = false;
async function ensureDbColumns(db) {
  if (dbMigrated)
    return;
  try {
    await db.prepare("ALTER TABLE todos ADD COLUMN is_pinned INTEGER DEFAULT 0").run();
  } catch {
  }
  dbMigrated = true;
}
__name(ensureDbColumns, "ensureDbColumns");
function normalizeDate(dateVal) {
  if (!dateVal)
    return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime()))
    return null;
  return d.toISOString();
}
__name(normalizeDate, "normalizeDate");
app.use("/api/todos/*", async (c, next) => {
  const cookieHeader = c.req.header("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies[c.env.COOKIE_NAME];
  if (!token) {
    return c.json({ error: "Ch\u01B0a \u0111\u0103ng nh\u1EADp. Vui l\xF2ng \u0111\u0103ng nh\u1EADp." }, 401);
  }
  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ error: "Phi\xEAn \u0111\u0103ng nh\u1EADp h\u1EBFt h\u1EA1n. Vui l\xF2ng \u0111\u0103ng nh\u1EADp l\u1EA1i." }, 401);
  }
  c.set("user", payload);
  await ensureDbColumns(c.env.DB);
  await next();
});
app.use("/api/categories", async (c, next) => {
  const cookieHeader = c.req.header("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies[c.env.COOKIE_NAME];
  if (!token) {
    return c.json({ error: "Ch\u01B0a \u0111\u0103ng nh\u1EADp." }, 401);
  }
  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ error: "Phi\xEAn h\u1EBFt h\u1EA1n." }, 401);
  }
  c.set("user", payload);
  await next();
});
app.post("/api/auth/register", async (c) => {
  try {
    const { email, username, password } = await c.req.json();
    if (!email || !username || !password) {
      return c.json({ error: "Vui l\xF2ng \u0111i\u1EC1n \u0111\u1EA7y \u0111\u1EE7 th\xF4ng tin." }, 400);
    }
    if (password.length < 6) {
      return c.json({ error: "M\u1EADt kh\u1EA9u ph\u1EA3i \xEDt nh\u1EA5t 6 k\xFD t\u1EF1." }, 400);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: "Email kh\xF4ng h\u1EE3p l\u1EC7." }, 400);
    }
    const existing = await c.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).bind(email.toLowerCase()).first();
    if (existing) {
      return c.json({ error: "Email \u0111\xE3 \u0111\u01B0\u1EE3c s\u1EED d\u1EE5ng." }, 409);
    }
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const id = generateId();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await c.env.DB.prepare(
      "INSERT INTO users (id, email, username, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(id, email.toLowerCase(), username.trim(), passwordHash, salt, now).run();
    const token = await createJWT(
      { sub: id, email: email.toLowerCase(), username: username.trim() },
      c.env.JWT_SECRET
    );
    return new Response(
      JSON.stringify({
        success: true,
        user: { id, email: email.toLowerCase(), username: username.trim() }
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": setSessionCookie(c.env.COOKIE_NAME, token)
        }
      }
    );
  } catch (err) {
    console.error("Register error:", err);
    return c.json({ error: "L\u1ED7i server. Vui l\xF2ng th\u1EED l\u1EA1i." }, 500);
  }
});
app.post("/api/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Vui l\xF2ng nh\u1EADp email v\xE0 m\u1EADt kh\u1EA9u." }, 400);
    }
    const user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).bind(email.toLowerCase()).first();
    if (!user) {
      return c.json({ error: "Email ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng." }, 401);
    }
    const valid = await verifyPassword(password, user.salt, user.password_hash);
    if (!valid) {
      return c.json({ error: "Email ho\u1EB7c m\u1EADt kh\u1EA9u kh\xF4ng \u0111\xFAng." }, 401);
    }
    const token = await createJWT(
      { sub: user.id, email: user.email, username: user.username },
      c.env.JWT_SECRET
    );
    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, email: user.email, username: user.username }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": setSessionCookie(c.env.COOKIE_NAME, token)
        }
      }
    );
  } catch (err) {
    console.error("Login error:", err);
    return c.json({ error: "L\u1ED7i server. Vui l\xF2ng th\u1EED l\u1EA1i." }, 500);
  }
});
app.post("/api/auth/logout", async (c) => {
  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": clearSessionCookie(c.env.COOKIE_NAME)
      }
    }
  );
});
app.get("/api/auth/me", async (c) => {
  const cookieHeader = c.req.header("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const token = cookies[c.env.COOKIE_NAME];
  if (!token) {
    return c.json({ authenticated: false }, 200);
  }
  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ authenticated: false }, 200);
  }
  return c.json({
    authenticated: true,
    user: {
      id: payload.sub,
      email: payload.email,
      username: payload.username
    }
  });
});
app.get("/api/todos", async (c) => {
  const user = c.get("user");
  const url = new URL(c.req.url);
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category");
  const priority = url.searchParams.get("priority");
  const search = url.searchParams.get("search");
  const sort = url.searchParams.get("sort") || "due_date";
  const order2 = url.searchParams.get("order") || "asc";
  let query = "SELECT *, COALESCE(is_pinned, 0) as is_pinned FROM todos WHERE user_id = ?";
  const params = [user.sub];
  if (status === "completed") {
    query += " AND is_completed = 1";
  } else if (status === "pending") {
    query += " AND is_completed = 0";
  } else if (status === "overdue") {
    query += " AND is_completed = 0 AND due_date IS NOT NULL AND due_date < ?";
    params.push((/* @__PURE__ */ new Date()).toISOString());
  }
  if (category && category !== "all") {
    query += " AND category = ?";
    params.push(category);
  }
  if (priority && priority !== "all") {
    query += " AND priority = ?";
    params.push(priority);
  }
  if (search) {
    query += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  const sortCol = sort === "created_at" ? "created_at" : "due_date";
  const sortOrder = order2 === "desc" ? "DESC" : "ASC";
  if (sortCol === "due_date") {
    query += ` ORDER BY is_pinned DESC, (due_date IS NULL), due_date ${sortOrder}, created_at DESC`;
  } else {
    query += ` ORDER BY is_pinned DESC, ${sortCol} ${sortOrder}`;
  }
  const result = await c.env.DB.prepare(query).bind(...params).all();
  return c.json({ todos: result.results || [] });
});
app.post("/api/todos", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    if (!body.title || !body.title.trim()) {
      return c.json({ error: "Ti\xEAu \u0111\u1EC1 kh\xF4ng \u0111\u01B0\u1EE3c \u0111\u1EC3 tr\u1ED1ng." }, 400);
    }
    const id = generateId();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const normalizedDueDate = normalizeDate(body.due_date);
    await c.env.DB.prepare(
      `INSERT INTO todos (id, user_id, title, description, category, priority, due_date, is_completed, is_pinned, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
    ).bind(
      id,
      user.sub,
      body.title.trim(),
      body.description?.trim() || "",
      body.category?.trim() || "Personal",
      body.priority || "Medium",
      normalizedDueDate,
      body.is_pinned ? 1 : 0,
      now,
      now
    ).run();
    const todo = await c.env.DB.prepare(
      "SELECT *, COALESCE(is_pinned, 0) as is_pinned FROM todos WHERE id = ?"
    ).bind(id).first();
    return c.json({ success: true, todo }, 201);
  } catch (err) {
    console.error("Create todo error:", err);
    return c.json({ error: "L\u1ED7i t\u1EA1o c\xF4ng vi\u1EC7c." }, 500);
  }
});
app.put("/api/todos/:id", async (c) => {
  try {
    const user = c.get("user");
    const todoId = c.req.param("id");
    const existing = await c.env.DB.prepare(
      "SELECT *, COALESCE(is_pinned, 0) as is_pinned FROM todos WHERE id = ? AND user_id = ?"
    ).bind(todoId, user.sub).first();
    if (!existing) {
      return c.json({ error: "Kh\xF4ng t\xECm th\u1EA5y c\xF4ng vi\u1EC7c." }, 404);
    }
    const body = await c.req.json();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const normalizedDueDate = body.due_date !== void 0 ? normalizeDate(body.due_date) : existing.due_date;
    await c.env.DB.prepare(
      `UPDATE todos SET
        title = ?,
        description = ?,
        category = ?,
        priority = ?,
        due_date = ?,
        is_completed = ?,
        is_pinned = ?,
        updated_at = ?
       WHERE id = ? AND user_id = ?`
    ).bind(
      body.title?.trim() ?? existing.title,
      body.description?.trim() ?? existing.description,
      body.category?.trim() ?? existing.category,
      body.priority ?? existing.priority,
      normalizedDueDate,
      body.is_completed !== void 0 ? body.is_completed : existing.is_completed,
      body.is_pinned !== void 0 ? body.is_pinned : existing.is_pinned,
      now,
      todoId,
      user.sub
    ).run();
    const updated = await c.env.DB.prepare(
      "SELECT *, COALESCE(is_pinned, 0) as is_pinned FROM todos WHERE id = ?"
    ).bind(todoId).first();
    return c.json({ success: true, todo: updated });
  } catch (err) {
    console.error("Update todo error:", err);
    return c.json({ error: "L\u1ED7i c\u1EADp nh\u1EADt c\xF4ng vi\u1EC7c." }, 500);
  }
});
app.patch("/api/todos/:id/toggle", async (c) => {
  try {
    const user = c.get("user");
    const todoId = c.req.param("id");
    const existing = await c.env.DB.prepare(
      "SELECT * FROM todos WHERE id = ? AND user_id = ?"
    ).bind(todoId, user.sub).first();
    if (!existing) {
      return c.json({ error: "Kh\xF4ng t\xECm th\u1EA5y c\xF4ng vi\u1EC7c." }, 404);
    }
    const newStatus = existing.is_completed ? 0 : 1;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await c.env.DB.prepare(
      "UPDATE todos SET is_completed = ?, updated_at = ? WHERE id = ? AND user_id = ?"
    ).bind(newStatus, now, todoId, user.sub).run();
    const updated = await c.env.DB.prepare(
      "SELECT *, COALESCE(is_pinned, 0) as is_pinned FROM todos WHERE id = ?"
    ).bind(todoId).first();
    return c.json({ success: true, todo: updated });
  } catch (err) {
    console.error("Toggle todo error:", err);
    return c.json({ error: "L\u1ED7i c\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i." }, 500);
  }
});
app.patch("/api/todos/:id/pin", async (c) => {
  try {
    const user = c.get("user");
    const todoId = c.req.param("id");
    const existing = await c.env.DB.prepare(
      "SELECT *, COALESCE(is_pinned, 0) as is_pinned FROM todos WHERE id = ? AND user_id = ?"
    ).bind(todoId, user.sub).first();
    if (!existing) {
      return c.json({ error: "Kh\xF4ng t\xECm th\u1EA5y c\xF4ng vi\u1EC7c." }, 404);
    }
    const newPinned = existing.is_pinned ? 0 : 1;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await c.env.DB.prepare(
      "UPDATE todos SET is_pinned = ?, updated_at = ? WHERE id = ? AND user_id = ?"
    ).bind(newPinned, now, todoId, user.sub).run();
    const updated = await c.env.DB.prepare(
      "SELECT *, COALESCE(is_pinned, 0) as is_pinned FROM todos WHERE id = ?"
    ).bind(todoId).first();
    return c.json({ success: true, todo: updated });
  } catch (err) {
    console.error("Pin todo error:", err);
    return c.json({ error: "L\u1ED7i ghim c\xF4ng vi\u1EC7c." }, 500);
  }
});
app.delete("/api/todos/:id", async (c) => {
  try {
    const user = c.get("user");
    const todoId = c.req.param("id");
    const existing = await c.env.DB.prepare(
      "SELECT id FROM todos WHERE id = ? AND user_id = ?"
    ).bind(todoId, user.sub).first();
    if (!existing) {
      return c.json({ error: "Kh\xF4ng t\xECm th\u1EA5y c\xF4ng vi\u1EC7c." }, 404);
    }
    await c.env.DB.prepare(
      "DELETE FROM todos WHERE id = ? AND user_id = ?"
    ).bind(todoId, user.sub).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("Delete todo error:", err);
    return c.json({ error: "L\u1ED7i xo\xE1 c\xF4ng vi\u1EC7c." }, 500);
  }
});
app.post("/api/todos/clear-completed", async (c) => {
  try {
    const user = c.get("user");
    await c.env.DB.prepare(
      "DELETE FROM todos WHERE user_id = ? AND is_completed = 1"
    ).bind(user.sub).run();
    return c.json({ success: true });
  } catch (err) {
    console.error("Clear completed error:", err);
    return c.json({ error: "L\u1ED7i d\u1ECDn d\u1EB9p c\xF4ng vi\u1EC7c." }, 500);
  }
});
app.get("/api/categories", async (c) => {
  const user = c.get("user");
  const result = await c.env.DB.prepare(
    'SELECT DISTINCT category FROM todos WHERE user_id = ? AND category IS NOT NULL AND category != "" ORDER BY category'
  ).bind(user.sub).all();
  const categories = (result.results || []).map((r) => r.category);
  const defaults = ["Personal", "Work", "Shopping", "Health", "Study"];
  const merged = [.../* @__PURE__ */ new Set([...defaults, ...categories])].sort();
  return c.json({ categories: merged });
});
app.get("/icon-192.png", async () => {
  const bytes = getIconPNGBytes();
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
});
app.get("/manifest.json", async () => {
  const manifest = {
    name: "To-Do List",
    short_name: "To-Do List",
    description: "\u1EE8ng d\u1EE5ng qu\u1EA3n l\xFD c\xF4ng vi\u1EC7c hi\u1EC7n \u0111\u1EA1i tr\xEAn Cloudflare Workers",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#2563eb",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  };
  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=86400"
    }
  });
});
app.get("/sw.js", async () => {
  return new Response(renderServiceWorker(), {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
});
app.get("/api/download/ios-profile", async (c) => {
  const url = new URL(c.req.url);
  const appOrigin = `${url.protocol}//${url.host}`;
  const mobileConfigContent = generateIOSMobileConfig(appOrigin);
  return new Response(mobileConfigContent, {
    headers: {
      "Content-Type": "application/x-apple-aspen-config; charset=utf-8",
      "Content-Disposition": 'attachment; filename="todolist.mobileconfig"',
      "Cache-Control": "no-cache"
    }
  });
});
app.get("*", async (c) => {
  return new Response(renderHTML(), {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
});
var src_default = app;
export {
  src_default as default
};
//# sourceMappingURL=index.js.map
