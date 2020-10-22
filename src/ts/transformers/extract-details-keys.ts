import { Entry, Header } from 'har-format';
import { getHeader, getHeaders } from '../helpers/har';
import {
  formatBytes,
  formatDateLocalized,
  formatMilliseconds,
  formatSeconds,
  MaybeStringOrNumber,
  parseAndFormat,
  parseDate,
  parseNonEmpty,
  parseNonNegative,
  parsePositive
} from '../helpers/parse';
import { KvTuple, SafeKvTuple } from '../typing/waterfall';
import { flattenKvTuple } from './helpers';

const byteSizeProperty = (title: string, input: MaybeStringOrNumber): KvTuple => {
  return [title, parseAndFormat(input, parsePositive, formatBytes)];
};
const countProperty = (title: string, input: MaybeStringOrNumber): KvTuple => {
  return [title, parseAndFormat(input, parsePositive)];
};

/** Predicate to filter out invalid or empty `KvTuple` */
const notEmpty = (kv: KvTuple) => {
  return kv.length > 1 && kv[1] !== undefined && kv[1] !== '';
};

interface IDateTimeFormatOptions extends Intl.DateTimeFormatOptions {
  fractionalSecondDigits: number;
}

const format: IDateTimeFormatOptions = {
  day: 'numeric',
  fractionalSecondDigits: 3,
  hour: 'numeric',
  hour12: true,
  minute: 'numeric',
  month: 'numeric',
  second: 'numeric',
  timeZone: 'UTC',
  weekday: 'long',
  year: 'numeric'
};

function timeConversion(milliseconds: number): string {
  var seconds = milliseconds / 1000;

  var minutes = milliseconds / (1000 * 60);

  var hours = milliseconds / (1000 * 60 * 60);

  var days = (milliseconds / (1000 * 60 * 60 * 24)).toFixed(1);

  if (milliseconds < 1000) {
    return milliseconds + ' ms';
  } else if (seconds < 60) {
    return seconds.toFixed(1) + ' sec';
  } else if (minutes < 60) {
    return minutes.toFixed(1) + ' min';
  } else if (hours < 24) {
    return hours.toFixed(1) + ' hr';
  } else {
    return days + ' days';
  }
}

export function parseGeneralDetails(
  entry: Entry,
  startRelative: number,
  requestID: number,
  reduceTuples: (tuples: KvTuple[], tuple: KvTuple, index: number, array: KvTuple[]) => KvTuple[] = (
    _tuples,
    _tuple,
    _index,
    array
  ) => array
): SafeKvTuple[] {
  return ([
    ['Request Number', `#${requestID}`],
    [
      'Started',
      new Date(entry.startedDateTime).toLocaleString(undefined, format) +
        (startRelative > 0 ? ' (' + timeConversion(startRelative) + ' after page request started)' : '')
    ],
    ['Duration', formatMilliseconds(entry.time)],
    ['Error/Status Code', entry.response.status + ' ' + entry.response.statusText],
    ['Server IPAddress', entry.serverIPAddress],
    ['Connection', entry.connection],
    ['Browser Priority', entry._priority || entry._initialPriority],
    ['Was pushed', parseAndFormat(entry._was_pushed, parsePositive, () => 'yes')],
    ['Initiator (Loaded by)', entry._initiator],
    ['Initiator Line', entry._initiator_line],
    ['Initiator Type', entry._initiator_type],
    ['Host', getHeader(entry.request.headers, 'Host')],
    ['IP', entry._ip_addr],
    ['Client Port', parseAndFormat(entry._client_port, parsePositive)],
    ['Expires', entry._expires],
    ['Cache Time', parseAndFormat(entry._cache_time, parsePositive, formatSeconds)],
    ['CDN Provider', entry._cdn_provider],
    byteSizeProperty('ObjectSize', entry._objectSize),
    byteSizeProperty('Bytes In (downloaded)', entry._bytesIn),
    byteSizeProperty('Bytes Out (uploaded)', entry._bytesOut),
    byteSizeProperty('JPEG Scan Count', entry._jpeg_scan_count),
    byteSizeProperty('Gzip Total', entry._gzip_total),
    byteSizeProperty('Gzip Save', entry._gzip_save),
    byteSizeProperty('Minify Total', entry._minify_total),
    byteSizeProperty('Minify Save', entry._minify_save),
    byteSizeProperty('Image Total', entry._image_total),
    byteSizeProperty('Image Save', entry._image_save)
  ] as KvTuple[])
    .reduce(reduceTuples, [])
    .filter(notEmpty) as SafeKvTuple[];
}

export function parseRequestDetails(harEntry: Entry): SafeKvTuple[] {
  const request = harEntry.request;
  const stringHeader = (name: string): KvTuple[] => getHeaders(request.headers, name);

  return flattenKvTuple([
    ['Method', request.method],
    ['HTTP Version', request.httpVersion],
    byteSizeProperty('Bytes Out (uploaded)', harEntry._bytesOut),
    byteSizeProperty('Headers Size', request.headersSize),
    byteSizeProperty('Body Size', request.bodySize),
    ['Comment', parseAndFormat(request.comment, parseNonEmpty)],
    stringHeader('User-Agent'),
    stringHeader('Host'),
    stringHeader('Connection'),
    stringHeader('Accept'),
    stringHeader('Accept-Encoding'),
    stringHeader('Expect'),
    stringHeader('Forwarded'),
    stringHeader('If-Modified-Since'),
    stringHeader('If-Range'),
    stringHeader('If-Unmodified-Since'),
    countProperty('Querystring parameters count', request.queryString.length),
    countProperty('Cookies count', request.cookies.length)
  ]).filter(notEmpty) as SafeKvTuple[];
}

export function parseResponseDetails(entry: Entry): SafeKvTuple[] {
  const response = entry.response;
  const content = response.content;
  const headers = response.headers;

  const stringHeader = (title: string, name: string = title): KvTuple[] => {
    return getHeaders(headers, name);
  };
  const dateHeader = (name: string): KvTuple => {
    const header = getHeader(headers, name);
    return [name, parseAndFormat(header, parseDate, formatDateLocalized)];
  };

  const contentLength = getHeader(headers, 'Content-Length');
  let contentSize;
  if (content.size && content.size !== -1 && contentLength !== content.size.toString()) {
    contentSize = content.size;
  }

  let contentType = getHeader(headers, 'Content-Type');
  if (entry._contentType && entry._contentType !== contentType) {
    contentType = contentType + ' | ' + entry._contentType;
  }

  return flattenKvTuple([
    ['Status', response.status + ' ' + response.statusText],
    ['HTTP Version', response.httpVersion],
    byteSizeProperty('Bytes In (downloaded)', entry._bytesIn),
    byteSizeProperty('Headers Size', response.headersSize),
    byteSizeProperty('Body Size', response.bodySize),
    ['Content-Type', contentType],
    stringHeader('Cache-Control'),
    stringHeader('Content-Encoding'),
    dateHeader('Expires'),
    dateHeader('Last-Modified'),
    stringHeader('Pragma'),
    byteSizeProperty('Content-Length', contentLength),
    byteSizeProperty('Content Size', contentSize),
    byteSizeProperty('Content Compression', content.compression),
    stringHeader('Connection'),
    stringHeader('ETag'),
    stringHeader('Accept-Patch'),
    ['Age', parseAndFormat(getHeader(headers, 'Age'), parseNonNegative, formatSeconds)],
    stringHeader('Allow'),
    stringHeader('Content-Disposition'),
    stringHeader('Location'),
    stringHeader('Strict-Transport-Security'),
    stringHeader('Trailer (for chunked transfer coding)', 'Trailer'),
    stringHeader('Transfer-Encoding'),
    stringHeader('Upgrade'),
    stringHeader('Vary'),
    stringHeader('Timing-Allow-Origin'),
    ['Redirect URL', parseAndFormat(response.redirectURL, parseNonEmpty)],
    ['Comment', parseAndFormat(response.comment, parseNonEmpty)]
  ]).filter(notEmpty) as SafeKvTuple[];
}

export function parseTimings(entry: Entry, start: number, end: number): SafeKvTuple[] {
  const timings = entry.timings;
  const optionalTiming = (timing?: number) => parseAndFormat(timing, parseNonNegative, formatMilliseconds);
  const total = typeof start !== 'number' || typeof end !== 'number' ? undefined : end - start;

  let connectVal = optionalTiming(timings.connect);
  if (timings.ssl && timings.ssl > 0 && timings.connect) {
    // SSL time is also included in the connect field (to ensure backward compatibility with HAR 1.1).
    connectVal = `${connectVal} (without TLS: ${optionalTiming(timings.connect - timings.ssl)})`;
  }
  return ([
    ['Total', formatMilliseconds(total)],
    ['Blocked', optionalTiming(timings.blocked)],
    ['DNS', optionalTiming(timings.dns)],
    ['Connect', connectVal],
    ['SSL (TLS)', optionalTiming(timings.ssl)],
    ['Send', formatMilliseconds(timings.send)],
    ['Wait', formatMilliseconds(timings.wait)],
    ['Receive', formatMilliseconds(timings.receive)]
  ] as KvTuple[]).filter(notEmpty) as SafeKvTuple[];
}

export function parseRequestHeaders(entry: Entry) {
  const requestHeaders = entry.request.headers;
  const headerToKvTuple = (header: Header): KvTuple => [
    header.name,
    typeof header.value === 'object' ? JSON.stringify(header.value) : header.value
  ];
  return requestHeaders.map(headerToKvTuple).filter(notEmpty) as SafeKvTuple[];
}

export function parseResponseHeaders(entry: Entry) {
  const responseHeaders = entry.response.headers;
  const headerToKvTuple = (header: Header): KvTuple => [
    header.name,
    typeof header.value === 'object' ? JSON.stringify(header.value) : header.value
  ];
  return responseHeaders.map(headerToKvTuple).filter(notEmpty) as SafeKvTuple[];
}
