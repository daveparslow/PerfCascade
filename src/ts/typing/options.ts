import { Entry } from 'har-format';
import { WaterfallDocs, WaterfallEntry } from './waterfall';

export interface ChartRenderOption {
  /** Height of every request bar block plus spacer pixel (in px) */
  rowHeight: number;
  /** Show vertical lines to easier spot potential dependencies/blocking between requests */
  showAlignmentHelpers: boolean;
  /** Show mime type icon on the left */
  showMimeTypeIcon: boolean;
  /** Show warning icons for potential issues on the left */
  showIndicatorIcons: boolean;
  /** Relative width of the info column on the left (in percent) */
  leftColumnWidth: number;
  /** Select element to use for paging (if not set no Selector is rendered)   */
  pageSelector: HTMLSelectElement;
  /** Zero-based index of the pre-selected page */
  selectedPage: number;
  /** Element that holds the Legend (if not set no Legend is sendered) */
  legendHolder: HTMLElement;
  /** Callback called when the HAR doc has been parsed into PerfCascases */
  onParsed: (data: WaterfallDocs) => void;
  onEntryParsed?: (entry: WaterfallEntry) => void;
  /** Set a row length time in ms (if not set the time is calculated from the HAR)  */
  fixedLengthMs: number;
}

export interface HarTransformerOptions {
  /** Should UserTimings in WPT be used and rendered as Mark (default: false) */
  showUserTiming: boolean | string[];
  /**
   * If this is enabled, the `endTimer-*` marker are shown,
   * and both start and end show the full `startTimer-*` and `endTimer-*` name. (default: false)
   *
   * _requires `showUserTiming` to be `true`_
   */
  showUserTimingEndMarker: boolean;

  getTabPlugins?: (
    entry: Entry,
    defaultPlugins: (string | TabPluginConfig)[]
  ) => (string | TabPluginConfig)[];
}

export interface TabPluginConfig {
  use: string;
  label: string;
}

/** TypeDefinition for `fromHar`'s options */
export type ChartOptions = Partial<ChartRenderOption & HarTransformerOptions>;
