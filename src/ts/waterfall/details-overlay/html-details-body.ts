import { makeBodyEl, makeHtmlEl } from "../../helpers/dom";
import { escapeHtml, sanitizeUrlForLink } from "../../helpers/parse";
import { RequestType, WaterfallEntry } from "../../typing/waterfall";

/**
 * Creates the HTML body for the overlay
 *
 * _All tab-able elements are set to `tabindex="-1"` to avoid tabbing issues_
 * @param requestID ID
 * @param detailsHeight
 * @param entry
 */
export function createDetailsBody(requestID: number, detailsHeight: number, entry: WaterfallEntry) {

  const html = makeHtmlEl();
  const body = makeBodyEl();

  const tabMenu = entry.tabs.map((t) => {
    return `<li><button class="tab-button">${t.title}</button></li>`;
  }).join("\n");

  const tabBody = entry.tabs.map((t) => {
    let cssClasses = "tab";
    if (t.tabClass) {
      cssClasses += ` ${t.tabClass}`;
    }
    let content = "";
    if (t.content) {
      content = t.content;
    } else if (typeof t.renderContent === "function") {
      content = t.renderContent(detailsHeight);
      // keep content for later
      t.content = content;
    } else {
      throw TypeError("Invalid Details Tab");
    }
    return `<div class="tab ${cssClasses}">${content}</div>`;
  }).join("\n");

  let url;
  if (entry.url && entry.url.startsWith("http")) {
    url = `<a href="${sanitizeUrlForLink(entry.url)}">
      ${escapeHtml(entry.url)}
    </a>`;
  } else {
    url =   escapeHtml(entry.url);
  }

  const normalizedRequestType = normalizeRequestType(entry.responseDetails.requestType);
  body.innerHTML = `
    <div class="wrapper">
      <header class="type-${normalizedRequestType}">
        <h3><strong>#${requestID}</strong> ${url}</h3>
        <nav class="tab-nav">
          <ul>
            ${tabMenu}
          </ul>
        </nav>
      </header>
      ${tabBody}
    </div>
    `;

  html.appendChild(body);
  return html;
}

const requestTypeMapping: { [key: string]: RequestType} = {
  audio: "audio",
  css: "css",
  flash: "flash",
  font: "font",
  html: "html",
  image: "image",
  javascript: "javascript",
  other: "other",
  svg: "svg",
  video: "video",
};

function normalizeRequestType(requestType: string): RequestType {
  const mapping = requestTypeMapping[requestType];
  if (!mapping) {
    return "javascript";
  }
  return mapping;
}