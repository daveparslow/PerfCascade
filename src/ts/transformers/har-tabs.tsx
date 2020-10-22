import * as React from 'react';
import { Entry } from 'har-format';
import { pluralize, toCssClass } from '../helpers/misc';
import { sanitizeUrlForLink } from '../helpers/parse';
import {
  RequestType,
  SafeKvTuple,
  TabReactRenderer,
  WaterfallEntryIndicator,
  WaterfallEntryTab
} from '../typing/waterfall';
import {
  parseGeneralDetails,
  parseRequestDetails,
  parseRequestHeaders,
  parseResponseDetails,
  parseTimings
} from './extract-details-keys';
import { ChartOptions } from '../main';
import { TabPluginConfig } from '../typing';

const escapedNewLineRegex = /\\n/g;
const newLineRegex = /\n/g;
const escapedTabRegex = /\\t/g;

/**
 * Generates the tabs for the details-overlay of a `Entry`
 * @param  {Entry} entry - the entry to parse
 * @param  {number} requestID
 * @param  {RequestType} requestType
 * @param  {number} startRelative - start time in ms, relative to the page's start time
 * @param  {number} endRelative - end time in ms, relative to the page's start time
 * @param  {number} detailsHeight - height of the details-overlay
 * @param  {WaterfallEntryIndicator[]} indicators
 * @returns WaterfallEntryTab
 */
export function makeTabs(
  entry: Entry,
  requestID: number,
  requestType: RequestType,
  startRelative: number,
  endRelative: number,
  indicators: WaterfallEntryIndicator[],
  options: ChartOptions
): WaterfallEntryTab[] {
  const tabsPlugins =
    (options.getTabPlugins && options.getTabPlugins(entry, defaultTabPlugins)) || defaultTabPlugins;
  return tabsPlugins.reduce<WaterfallEntryTab[]>((tabs, pluginName) => {
    const registeredTabPlugin =
      registeredTabPlugins[typeof pluginName === 'string' ? pluginName : pluginName.use];

    if (!registeredTabPlugin) {
      return tabs;
    }

    const tab = registeredTabPlugin(
      entry,
      requestID,
      requestType,
      startRelative,
      endRelative,
      indicators,
      typeof pluginName !== 'string' ? pluginName : undefined
    );
    if (tab) {
      tabs.push(tab);
    }
    return tabs;
  }, []);
}

export type TabPlugin = (
  entry: Entry,
  requestID: number,
  requestType: RequestType,
  startRelative: number,
  endRelative: number,
  indicators: WaterfallEntryIndicator[]
) => WaterfallEntryTab | undefined;

const registeredTabPlugins = {
  general: makeGeneralTabPlugin,
  request: makeRequestTabPlugin,
  response: makeResponseTabPlugin,
  timings: makeTimingsTabPlugin,
  raw: makeRawTabPlugin,
  image: makeImageTabPlugin,
  content: makeContentTabPlugin
};

const defaultTabPlugins: (keyof typeof registeredTabPlugins)[] = [
  'general',
  'request',
  'response',
  'timings',
  'raw',
  'image',
  'content'
];

export function makeGeneralTabPlugin(
  entry: Entry,
  requestID: number,
  _requestType: RequestType,
  startRelative: number,
  _endRelative: number,
  indicators: WaterfallEntryIndicator[],
  config: TabPluginConfig
) {
  const general = parseGeneralDetails(entry, startRelative, requestID, config?.reduceTuples);
  return makeGeneralTab(general, indicators, config);
}

export function makeRequestTabPlugin(
  entry: Entry,
  _requestID: number,
  _requestType: RequestType,
  _startRelative: number,
  _endRelative: number,
  _indicators: WaterfallEntryIndicator[],
  config?: TabPluginConfig
) {
  const request = parseRequestDetails(entry);
  const requestHeaders = parseRequestHeaders(entry);
  return makeRequestTab(request, requestHeaders, config);
}

export function makeResponseTabPlugin(
  entry: Entry,
  _requestID: number,
  _requestType: RequestType,
  _startRelative: number,
  _endRelative: number,
  _indicators: WaterfallEntryIndicator[],
  config?: TabPluginConfig
) {
  const response = parseResponseDetails(entry);
  const responseHeaders = parseRequestHeaders(entry);
  return makeResponseTab(response, responseHeaders, config);
}

export function makeTimingsTabPlugin(
  entry: Entry,
  _requestID: number,
  _requestType: RequestType,
  startRelative: number,
  endRelative: number,
  _indicators: WaterfallEntryIndicator[],
  config?: TabPluginConfig
) {
  const timings = parseTimings(entry, startRelative, endRelative);
  return makeLazyWaterfallEntryTab(config?.label || 'Timings', () => definitionList(timings, true));
}

export function makeImageTabPlugin(
  entry: Entry,
  _requestID: number,
  requestType: RequestType,
  _startRelative: number,
  _endRelative: number,
  _indicators: WaterfallEntryIndicator[],
  config?: TabPluginConfig
) {
  if (requestType === 'image' && entry.request.url.startsWith('http')) {
    return undefined;
  }
  return makeImgTab(entry, config);
}

export function makeRawTabPlugin(
  entry: Entry,
  _requestID: number,
  _requestType: RequestType,
  _startRelative: number,
  _endRelative: number,
  _indicators: WaterfallEntryIndicator[],
  config?: TabPluginConfig
) {
  return makeRawData(entry, config);
}

export function makeContentTabPlugin(
  entry: Entry,
  _requestID: number,
  _requestType: RequestType,
  _startRelative: number,
  _endRelative: number,
  _indicators: WaterfallEntryIndicator[],
  config?: TabPluginConfig
) {
  if (
    entry.response.content &&
    entry.response.content.mimeType.indexOf('text/') === 0 &&
    entry.response.content.text
  ) {
    return makeContentTab(entry, config);
  }
  return undefined;
}

/** Helper to create `WaterfallEntryTab` object literal that is evaluated lazily at runtime (e.g. for performance) */
function makeLazyWaterfallEntryTab(
  title: string,
  renderTab?: TabReactRenderer,
  tabClass: string = ''
): WaterfallEntryTab {
  return {
    renderTab,
    tabClass,
    title
  };
}

/** General tab with warnings etc. */
function makeGeneralTab(
  generalData: SafeKvTuple[],
  indicators: WaterfallEntryIndicator[],
  config?: TabPluginConfig
): WaterfallEntryTab {
  const mainContent = definitionList(generalData);
  if (indicators.length === 0) {
    return makeLazyWaterfallEntryTab(config?.label || 'General', () => mainContent);
  }

  // Make indicator sections
  const errors = indicators.filter(i => i.type === 'error').map(i => [i.title, i.description] as SafeKvTuple);
  const warnings = indicators
    .filter(i => i.type === 'warning')
    .map(i => [i.title, i.description] as SafeKvTuple);
  // all others
  const info = indicators
    .filter(i => i.type !== 'error' && i.type !== 'warning')
    .map(i => [i.title, i.description] as SafeKvTuple);

  return makeLazyWaterfallEntryTab(config?.label || 'General', () => (
    <>
      {errors.length > 0 ? (
        <>
          <h2 className="no-border">{pluralize('Error', errors.length)}</h2>
          <dl>{definitionList(errors)}</dl>
        </>
      ) : null}
      {warnings.length > 0 ? (
        <>
          <h2 className="no-border">{pluralize('Warning', warnings.length)}</h2>
          <dl>{definitionList(warnings)}</dl>
        </>
      ) : null}
      {info.length > 0 ? (
        <>
          <h2 className="no-border">Info</h2>
          <dl>{definitionList(info)}</dl>
        </>
      ) : null}
      <h2>General</h2>
      <dl>{mainContent}</dl>
    </>
  ));
}

export function definitionList(dlKeyValues: SafeKvTuple[], addClass: boolean = false): JSX.Element {
  const makeClass = (key: string) => {
    if (!addClass) {
      return '';
    }
    const className = toCssClass(key) || 'no-colour';
    return `class="${className}"`;
  };

  const result = dlKeyValues.map(tuple => (
    <React.Fragment key={`${tuple[0]}-dt`}>
      <dt className={makeClass(tuple[0])}>{tuple[0] + ''}</dt>
      <dd>{tuple[1] + ''}</dd>
    </React.Fragment>
  ));

  return <>{result}</>;
}

function makeRequestTab(
  request: SafeKvTuple[],
  requestHeaders: SafeKvTuple[],
  config?: TabPluginConfig
): WaterfallEntryTab {
  return makeLazyWaterfallEntryTab(config?.label || 'Request', () => (
    <>
      {!config || config.isNetwork ? <dl>{definitionList(request)}</dl> : null}
      {!config || config.isNetwork ? <h2>All Request Headers</h2> : null}
      <dl>{definitionList(requestHeaders)}</dl>
    </>
  ));
}

function makeResponseTab(
  response: SafeKvTuple[],
  responseHeaders: SafeKvTuple[],
  config?: TabPluginConfig
): WaterfallEntryTab {
  return makeLazyWaterfallEntryTab(config?.label || 'Response', () => (
    <>
      {!config || config.isNetwork ? <dl>{definitionList(response)}</dl> : null}
      {!config || config.isNetwork ? <h2>All Response Headers</h2> : null}
      <dl>{definitionList(responseHeaders)}</dl>
    </>
  ));
}

/** Tab to show the returned (text-based) payload (HTML, CSS, JS etc.) */
function makeContentTab(entry: Entry, config?: TabPluginConfig) {
  const escapedText = entry.response.content.text || '';
  const unescapedText = escapedText.replace(escapedNewLineRegex, '\n').replace(escapedTabRegex, '\t');
  const newLines = escapedText.match(newLineRegex);
  const lineCount = newLines ? newLines.length : 1;
  return makeLazyWaterfallEntryTab(
    config?.label || `Content (${lineCount} Line${lineCount > 1 ? 's' : ''})`,
    // class `copy-tab-data` needed to catch bubbled up click event in `details-overlay/html-details-body.ts`
    () => (
      <>
        <button className="copy-tab-data">Copy Content to Clipboard</button>
        <pre>
          <code>{unescapedText}</code>
        </pre>
      </>
    ),
    'content rendered-data'
  );
}

function makeRawData(entry: Entry, config?: TabPluginConfig) {
  return makeLazyWaterfallEntryTab(
    config?.label || 'Raw Data',
    () => {
      // class `copy-tab-data` needed to catch bubbled up click event in `details-overlay/html-details-body.ts`
      return (
        <>
          <button className="copy-tab-data">Copy Raw Data to Clipboard</button>
          <pre>
            <code>{JSON.stringify(entry, null, 2)}</code>
          </pre>
        </>
      );
    },
    'raw-data rendered-data'
  );
}

/** Image preview tab */
function makeImgTab(entry: Entry, config?: TabPluginConfig): WaterfallEntryTab {
  return makeLazyWaterfallEntryTab(config?.label || 'Preview', (detailsHeight: number) => (
    <img
      className="preview"
      style={{ maxHeight: `${detailsHeight - 100}px` }}
      data-src={sanitizeUrlForLink(entry.request.url)}
    />
  ));
}
