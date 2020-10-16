import { makeElement } from '../../helpers/dom';
import { RequestType, WaterfallEntry } from '../../typing/waterfall';
import { renderDetails } from './DetailsBody';

/**
 * Creates the HTML body for the overlay
 *
 * _All tab-able elements are set to `tabindex="-1"` to avoid tabbing issues_
 * @param requestID ID
 * @param detailsHeight
 * @param entry
 */
export function createDetailsBody(requestID: number, detailsHeight: number, entry: WaterfallEntry) {
  const html = makeElement('div');
  html.className = 'wrapper';
  const normalizedRequestType = normalizeRequestType(entry.responseDetails.requestType);

  renderDetails(
    {
      className: `type-${normalizedRequestType}`,
      detailsHeight,
      tabs: entry.tabs,
      title: { sequenceNumber: requestID, title: entry.url }
    },
    html
  );
  return html;
}

const requestTypeMapping: { [key: string]: RequestType } = {
  audio: 'audio',
  css: 'css',
  flash: 'flash',
  font: 'font',
  html: 'html',
  image: 'image',
  javascript: 'javascript',
  other: 'other',
  svg: 'svg',
  video: 'video'
};

function normalizeRequestType(requestType: string): RequestType {
  const mapping = requestTypeMapping[requestType];
  if (!mapping) {
    return 'javascript';
  }
  return mapping;
}
