
import { getIcon } from "../../helpers/icon";
import {
  isTabDown,
  isTabUp,
} from "../../helpers/misc";
import * as svg from "../../helpers/svg";
import { Context } from "../../typing/context";
import { RectData } from "../../typing/rect-data";
import { WaterfallEntry } from "../../typing/waterfall";
import { getIndicatorIcons } from "./svg-indicators";
import * as rowSubComponents from "./svg-row-subcomponents";

// initial clip path
const clipPathElProto = svg.newClipPath("titleClipPath");
clipPathElProto.appendChild(svg.newRect({
  height: "100%",
  width: "100%",
}));

const clipPathElFullProto = svg.newClipPath("titleFullClipPath");
clipPathElFullProto.appendChild(svg.newRect({
  height: "100%",
  width: "100%",
}));

const ROW_LEFT_MARGIN = 3;

// Create row for a single request
export function createRow(context: Context, index: number,
                          maxIconsWidth: number, maxNumberWidth: number,
                          rectData: RectData, entry: WaterfallEntry,
                          onDetailsOverlayShow: EventListener): SVGAElement {

  const y = rectData.y;
  const rowHeight = rectData.height;
  const leftColumnWidth = context.options.leftColumnWidth;
  const rowItem = svg.newA(entry.responseDetails.rowClass || "" as never);
  rowItem.setAttribute("tabindex", "0");
  rowItem.setAttribute("xlink:href", "javascript:void(0)");
  const leftFixedHolder = svg.newSvg("left-fixed-holder", {
    width: `${leftColumnWidth}%`,
    x: "0",
  });
  const flexScaleHolder = svg.newSvg("flex-scale-waterfall", {
    width: `${100 - leftColumnWidth}%`,
    x: `${leftColumnWidth}%`,
  });

  const rect = rowSubComponents.createRect(rectData, entry);
  const rowName = rowSubComponents.createNameRowBg(y, rowHeight);
  const rowBar = rowSubComponents.createRowBg(y, rowHeight);
  const bgStripe = rowSubComponents.createBgStripe(y, rowHeight, (index % 2 === 0));

  let x = ROW_LEFT_MARGIN + maxIconsWidth;

  if (context.options.showMimeTypeIcon) {
    const icon = entry.responseDetails.icon;
    x -= icon.width;
    rowName.appendChild(getIcon(icon.type)(x, y + 3, icon.title));
  }

  if (context.options.showIndicatorIcons) {
    // Create and add warnings for potentia;l issues
    getIndicatorIcons(entry).forEach((icon) => {
      x -= icon.width;
      rowName.appendChild(getIcon(icon.type)(x, y + 3, icon.title));
    });
  }

  // Jump to the largest offset of all rows
  x = ROW_LEFT_MARGIN + maxIconsWidth;

  const requestNumber = `${index + 1}`;

  const requestNumberLabel = rowSubComponents.createRequestNumberLabel(x, y, requestNumber, rowHeight, maxNumberWidth);
  // 4 is slightly bigger than the hover "glow" around the url
  x += maxNumberWidth + 4;
  const shortLabel = rowSubComponents.createRequestLabelClipped(x, y, entry.url,
    rowHeight);
  const fullLabel = rowSubComponents.createRequestLabelFull(x, y, entry.url, rowHeight);

  // create and attach request block
  rowBar.appendChild(rect);

  rowSubComponents.appendRequestLabels(rowName, requestNumberLabel, shortLabel, fullLabel);

  context.pubSub.subscribeToSpecificOverlayChanges(index, (change) => {
    hasOpenOverlay = (change.type === "open");
  });
  if (index > 0) {
    context.pubSub.subscribeToSpecificOverlayChanges(index - 1, (change) => {
      hasPrevOpenOverlay = (change.type === "open");
    });
  }

  let hasOpenOverlay: boolean;
  let hasPrevOpenOverlay: boolean;

  rowItem.addEventListener("click", (evt: MouseEvent) => {
    evt.preventDefault();
    onDetailsOverlayShow(evt);
  });
  rowItem.addEventListener("keydown", (evt) => {
    const e = evt as KeyboardEvent; // need to type this manually
    // space on enter
    if (e.which === 32 || e.which === 13) {
      e.preventDefault();
      return onDetailsOverlayShow(e);
    }

    // tab without open overlays around
    if (isTabUp(e) && !hasPrevOpenOverlay && index > 0) {
      if (rowItem.previousSibling &&
        rowItem.previousSibling.previousSibling &&
        rowItem.previousSibling.previousSibling.lastChild &&
        rowItem.previousSibling.previousSibling.lastChild.lastChild) {
        rowItem.previousSibling.previousSibling.lastChild.lastChild.dispatchEvent(new MouseEvent("mouseenter"));
      }
      return;
    }
    if (isTabDown(e) && !hasOpenOverlay) {
      if (rowItem.nextSibling &&
          rowItem.nextSibling.nextSibling &&
          rowItem.nextSibling.nextSibling.lastChild &&
          rowItem.nextSibling.nextSibling.lastChild.lastChild
        ) {
        rowItem.nextSibling.nextSibling.lastChild.lastChild.dispatchEvent(new MouseEvent("mouseenter"));
      }
      return;
    }
  });

  rowItem.addEventListener("focusout", () => {
    rowName.dispatchEvent(new MouseEvent("mouseleave"));
  });

  flexScaleHolder.appendChild(rowBar);
  leftFixedHolder.appendChild(clipPathElProto.cloneNode(true));
  leftFixedHolder.appendChild(rowName);

  rowItem.appendChild(clipPathElFullProto.cloneNode(true));
  rowItem.appendChild(bgStripe);
  rowItem.appendChild(flexScaleHolder);
  rowItem.appendChild(leftFixedHolder);

  return rowItem;
}
