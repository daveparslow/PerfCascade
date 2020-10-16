import * as React from 'react';
import { Entry } from 'har-format';
import { pluralize, toCssClass } from '../helpers/misc';
import { sanitizeUrlForLink } from '../helpers/parse';
import {
  RequestType,
  SafeKvTuple,
  TabReactRenderer,
  TabRenderer,
  WaterfallEntryIndicator,
  WaterfallEntryTab
} from '../typing/waterfall';
import { getKeys } from './extract-details-keys';
import { makeDefinitionList } from './helpers';

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
  indicators: WaterfallEntryIndicator[]
): WaterfallEntryTab[] {
  const tabs = [] as WaterfallEntryTab[];

  const tabsData = getKeys(entry, requestID, startRelative, endRelative);
  tabs.push(makeGeneralTab(tabsData.general, indicators));
  tabs.push(makeRequestTab(tabsData.request, tabsData.requestHeaders));
  tabs.push(makeResponseTab(tabsData.response, tabsData.responseHeaders));
  tabs.push(makeWaterfallEntryTab('Timings', makeDefinitionList(tabsData.timings, true)));
  tabs.push(makeRawData(entry));
  if (requestType === 'image' && entry.request.url.startsWith('http')) {
    tabs.push(makeImgTab(entry));
  }
  if (
    entry.response.content &&
    entry.response.content.mimeType.indexOf('text/') === 0 &&
    entry.response.content.text
  ) {
    tabs.push(makeContentTab(entry));
  }
  return tabs.filter(t => t !== undefined);
}

/** Helper to create `WaterfallEntryTab` object literal  */
function makeWaterfallEntryTab(title: string, content: string, tabClass: string = ''): WaterfallEntryTab {
  return {
    content,
    tabClass,
    title
  };
}

/** Helper to create `WaterfallEntryTab` object literal that is evaluated lazily at runtime (e.g. for performance) */
function makeLazyWaterfallEntryTab(
  title: string,
  renderContent?: TabRenderer,
  tabClass: string = '',
  renderTab?: TabReactRenderer
): WaterfallEntryTab {
  return {
    renderContent,
    renderTab,
    tabClass,
    title
  };
}

/** General tab with warnings etc. */
function makeGeneralTab(
  generalData: SafeKvTuple[],
  indicators: WaterfallEntryIndicator[]
): WaterfallEntryTab {
  const mainContent = definitionList(generalData);
  if (indicators.length === 0) {
    return makeLazyWaterfallEntryTab('General', undefined, undefined, () => mainContent);
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

  return makeLazyWaterfallEntryTab('General', undefined, undefined, () => (
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
    <>
      <dt className={makeClass(tuple[0])}>{tuple[0]}</dt>
      <dd>{tuple[1]}</dd>
    </>
  ));

  return <>{result}</>;
}

function makeRequestTab(request: SafeKvTuple[], requestHeaders: SafeKvTuple[]): WaterfallEntryTab {
  return makeLazyWaterfallEntryTab('Request', undefined, undefined, () => (
    <>
      <dl>{definitionList(request)}</dl>
      <h2>All Response Headers</h2>
      <dl>{definitionList(requestHeaders)}</dl>
    </>
  ));
}

function makeResponseTab(response: SafeKvTuple[], responseHeaders: SafeKvTuple[]): WaterfallEntryTab {
  return makeLazyWaterfallEntryTab('Response', undefined, undefined, () => (
    <>
      <dl>{definitionList(response)}</dl>
      <h2>All Response Headers</h2>
      <dl>{definitionList(responseHeaders)}</dl>
    </>
  ));
}

/** Tab to show the returned (text-based) payload (HTML, CSS, JS etc.) */
function makeContentTab(entry: Entry) {
  const escapedText = entry.response.content.text || '';
  const unescapedText = escapedText.replace(escapedNewLineRegex, '\n').replace(escapedTabRegex, '\t');
  const newLines = escapedText.match(newLineRegex);
  const lineCount = newLines ? newLines.length : 1;
  return makeLazyWaterfallEntryTab(
    `Content (${lineCount} Line${lineCount > 1 ? 's' : ''})`,
    // class `copy-tab-data` needed to catch bubbled up click event in `details-overlay/html-details-body.ts`
    undefined,
    'content rendered-data',
    () => (
      <>
        <button className="copy-tab-data">Copy Content to Clipboard</button>
        <pre>
          <code>{unescapedText}</code>
        </pre>
      </>
    )
  );
}

function makeRawData(entry: Entry) {
  return makeLazyWaterfallEntryTab('Raw Data', undefined, 'raw-data rendered-data', () => {
    // class `copy-tab-data` needed to catch bubbled up click event in `details-overlay/html-details-body.ts`
    return (
      <>
        <button className="copy-tab-data">Copy Raw Data to Clipboard</button>
        <pre>
          <code>{JSON.stringify(entry, null, 2)}</code>
        </pre>
      </>
    );
  });
}

/** Image preview tab */
function makeImgTab(entry: Entry): WaterfallEntryTab {
  return makeLazyWaterfallEntryTab('Preview', undefined, undefined, (detailsHeight: number) => (
    <img
      className="preview"
      style={{ maxHeight: `${detailsHeight - 100}px` }}
      data-src={sanitizeUrlForLink(entry.request.url)}
    />
  ));
}
