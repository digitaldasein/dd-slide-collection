// SPDX-FileCopyrightText: 2022 Digital Dasein <https://digital-dasein.gitlab.io/>
// SPDX-FileCopyrightText: 2022 Gerben Peeters <gerben@digitaldasein.org>
// SPDX-FileCopyrightText: 2022 Senne Van Baelen <senne@digitaldasein.org>
//
// SPDX-License-Identifier: MIT

import { html, css, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

/*---------------------------------------------------------------------*/
/* Config                                                              */
/*---------------------------------------------------------------------*/

const DEFAULT_ATTRIBUTES = {
  author: '',
  mainTitle: 'dummy-title',
  subTitle: '',
  date: '',
  url: '',
  imgSrc: '',
  imgUrl: '',
  organisation: '',
  organisationUrl: '',
  full: false,
  fullScaleFactor: 1,
  configPath: '',
  cursorTimeout: 3000,
};

let CURSOR_TIMER: ReturnType<typeof setTimeout>;

/*---------------------------------------------------------------------*/
/* Utils                                                               */
/*---------------------------------------------------------------------*/

function insertHtmlWrongElem(elem: HTMLElement) {
  return `
<i>[WARNING] <code>${elem.nodeName}</code> element is not allowed.
<br>
<br>
Only include <code>section and dd-slide</code> elements, or elements with
<code>.slide</code> class inside a <code>dd-slide-collection</code>, otherwise,
the slide will not be rendered properly</i>
`;
}

async function getJsonConfig(url: string) {
  /* first check head to see if file exists (no need to fetch whole file if
   * when looping over multiple possible filepaths */
  const _checkFileExists = async (urlCheck: string) => {
    const response = await fetch(urlCheck, { method: 'HEAD' });
    if (response.status !== 404) {
      return true;
    }

    console.error(`JSON config does not exist at '${urlCheck}'`);
    return false;
  };

  const bFile = await _checkFileExists(url);

  if (bFile) {
    try {
      const response = await fetch(url);
      const json = await response.json();
      return json;
    } catch (err: any) {
      console.error(`Error while reading config file at ${url} \n\n ${err}`);
    }
  }

  return {
    error: 'Could not parse JSON config, see console for errors',
  };
}

/*---------------------------------------------------------------------*/
/* Main                                                                */
/*---------------------------------------------------------------------*/

/**
 * Main class for HTML web component **`dd-slide-collection`**
 *
 * For **styling** this component, check out {@link DdSlideCollection.styles |
 * the styles section}.
 *
 * <u>**Important note**</u>: all lit-component properties (interpreted here as
 * `other properties`) that are documented here have a **corresponding
 * HTML attribute**. The _non-attribute_ properties are consired private,
 * and are ingored in the documentation.
 *
 * @example
 * A simple slide collection containing two slide elements, one `dd-component`
 * (`dd-slide`), and one native `section` with `class="slide"`. This example
 * moreover illustrates a limited amount of collection config attributes.
 *
 * ```html
 * <html>
 *   [...]
 *   <dd-slide-collection main-title="My main title"
 *                        sub-title="my sub title"
 *                        author="some author"
 *                        organisation="My Org"
 *                        organisation-url=""
 *                        date="">
 *
 *     <dd-slide>
 *       <h2>My first slide</h2>
 *     </dd-slide>
 *     <section class="slide">
 *       <h2>A section also works</h2>
 *     </section>
 *   </dd-slide-collection>
 *   [...]
 * </html>
 * ```
 *
 * The caption in `list`-mode has a default style, however, you could simply
 * add a <b>custom caption</b> with the `caption` slot inside a slide collection (it
 * will overwrite the default):
 *
 * ```html
 * <dd-slide-collection ...>
 *   <div slot="caption">
 *      This is a custom caption, which can hold any HTML
 *      content you want
 *   </div>
 *  </dd-slide-collection>
 */

export class DdSlideCollection extends LitElement {
  /**
   * To style the `dd-slide-collection` component, use the following **CSS host
   * variables** (including their default values):
   *
   * |  <div style="width:200px">CSS variable</div>   | <div style="width:200px">Default</div>   | Description |
   * |:-----------------------------------------------|:-----------------------------------------|:------------|
   * |**`--dd-color-prim`**        |`None`                      | primary `dd-component` color, which propagates into nested `dd-elements`                  |
   * |**`--dd-color-prim-dark`**   |`None`                      | *dark-theme* primary `dd-component` color, which propagates into nested `dd-elements`     |
   * |**`--dd-color-sec`**         |`None`                      | secundary `dd-component` color, which propagates into nested `dd-elements`                |
   * |**`--dd-color-sec-dark`**    |`None`                      | *dark-theme* secundary `dd-component` color, which propagates into nested `dd-elements`   |
   * |**`--dd-color-list-bg`**     |`None`                      | background color for `list`-mode                                                          |
   * |**`--dd-color-text`**        |`None (default)`            | main text color,  which propagates into nested `dd-elements`                              |
   * |**`--dd-color-text-light`**  |`None (default)`            | *light* text color, which propagates into nested `dd-elements`                            |
   * |**`--dd-color-caption-bg`**  |`var(--dd-color-prim-dark, rgba(65, 90, 72, 1))`       | caption ackground color, falls back to `rgba(65, 90, 72, 1)` if not defined               |
   * |**`--dd-color-caption-fg`**  |`var(--dd-color-text-light, rgba(255,255,255,1)`)| caption foreground color                                                                  |
   * |**`--dd-slide-gap`**         |`96px`                      | gap between slides in `list`-mode                                                         |
   * |**`--dd-slide-ratio`**       |`calc(16/9)`                | slide apsect ratio |
   * |**`--dd-slide-width`**       |`1024px`                    | slide width (this, together with`--dd-slide-ratio` determines the slide height)           |
   * |**`--dd-full-scale-factor`** |`1`                         | factor for presenting in full screen (e.g. 0.8 will render the `full` slide at  80% of the maximum screen size) |
   * |**`--dd-font`**              |`24px/2 'Roboto', sans-serif`| font style |
   * |**`--dd-font-size`**         |`24px`                      | font _size_ setter |
   * |**`--dd-caption-height`**    |`250px`                     | height of the caption in `list`-mode |
   * |**`--dd-slide-nr-font-size`**|`16px`                      | slide number font-size |
   * |**`--dd-slide-nr-color`**    |`var(--dd-color-text)`      | slide number color     |
   * |**`--dd-slide-nr-right`**    |`13px`                      | slide number right     |
   * |**`--dd-slide-nr-bottom`**   |`0`                         | slide number bottom    |
   *
   * The variables can be set anywhere in your HTML context (e.g. in `:root`,
   * up until the `dd-slide-collection` component itself).
   *
   */

  static styles = css`
    :host {
      /* Ddpres fillers */

      /* dd color pallette */

      --slide-collect-color-prim: var(--dd-color-prim);
      --slide-collect-color-prim-dark: var(--dd-color-prim-dark);
      --slide-collect-color-sec: var(--dd-color-sec);
      --slide-collect-list-bg-color: var(
        --dd-color-list-bg,
        rgba(248, 237, 227, 0.5)
      );
      --slide-collect-text-color: var(--dd-color-text, rgba(0, 0, 0, 0.9));
      --slide-collect-text-color-light: var(
        --dd-color-text-light,
        rgba(255, 255, 255, 1)
      );

      --slide-collect-gap: var(--dd-slide-gap, 96px);
      --slide-collect-ratio: var(--dd-slide-ratio, calc(16 / 9));
      --slide-collect-width: var(--dd-slide-width, 1024px);
      --slide-collect-height: var(
        --dd-slide-height,
        calc(var(--slide-collect-width) / var(--slide-collect-ratio))
      );
      --slide-collect-full-scale-factor: var(--dd-full-scale-factor, 1);
      --slide-collect-font: var(--dd-font, 24px/2 'Roboto', sans-serif);
      --slide-collect-font-size: var(--dd-font-size, 24px);

      --caption-height: var(--dd-caption-height, 250px);
      --caption-center-width: 60%;
      --caption-font-size: calc(2.2 * var(--slide-collect-font-size));
      --caption-padding-left: 30px;
      --caption-padding-top: 30px;
      --caption-padding-right: 30px;
      --caption-padding-bottom: 30px;
      --caption-img-height: calc(0.6 * var(--caption-height));
      --caption-fg-color: var(
        --dd-color-caption-fg,
        var(--slide-collect-text-color-light)
      );

      --dd-color-caption-bg: var(--dd-color-prim-dark, rgba(65, 90, 72, 1));
      --caption-bg-color: var(--dd-color-caption-bg);

      --slide-collect-slide-nr-font-size: var(--dd-slide-nr-font-size, 16px);
      --slide-collect-slide-nr-right: var(--dd-slide-nr-right, 13px);

      --dd-slide-nr-bottom: 0em;

      --slide-collect-slide-nr-bottom: var(--dd-slide-nr-bottom, 0.2em);
      --slide-collect-slide-nr-color: var(
        --dd-slide-nr-color,
        var(--slide-collect-text-color)
      );

      --slide-scale: 1;

      margin: 0;
      padding: 0;
      color: black;
      counter-reset: slide;

      font: var(--slide-collect-font);
      font-size: var(--slide-collect-font-size);
    }

    /* Full */

    :host(.full) {
      display: block;
    }

    /* Hover */

    :host(.list) ::slotted(section:hover),
    :host(.list) ::slotted(.slide:hover) {
      box-shadow: 0 0 0 20px
        var(--slide-collect-color-prim, rgba(65, 90, 72, 0.5));
    }

    ::slotted(section),
    ::slotted(.slide) {
      position: relative;
      z-index: 0;
      overflow: hidden;
      box-sizing: border-box;
      width: var(--slide-collect-width);
      max-width: 100%;
      height: var(--slide-collect-height);
      background-color: white;
      margin: 0 auto;
      /*margin-bottom: var(--slide-collect-gap)*/
    }

    :host(.full) ::slotted(section),
    :host(.full) ::slotted(.slide) {
      position: absolute;
      transform-origin: 0 0;
      transform: scale(var(--slide-collect-full-scale-factor));
      border: 1px solid black;
    }

    /* Number */

    ::slotted(section)::after,
    ::slotted(.slide)::after {
      position: absolute;
      font-size: var(--slide-collect-slide-nr-font-size);
      right: var(--slide-collect-slide-nr-right);
      bottom: calc(var(--slide-collect-slide-nr-bottom));
      left: 0px;
      color: var(--slide-collect-slide-nr-color);
      text-align: right;
      counter-increment: slide;
      content: counter(slide);
      z-index: 2;
    }
    ::slotted(.slide.titlepage)::after,
    ::slotted(dd-titlepage)::after {
      counter-increment: slide;
      content: '';
    }

    /* List */

    :host(.list) ::slotted(.slide),
    :host(.list) ::slotted(section) {
      position: relative;
      box-shadow: calc(var(--slide-scale) * 4px) calc(var(--slide-scale) * 4px)
        0 calc(var(--slide-scale) * 4px)
        var(--slide-collect-color-prim-dark, rgba(0, 0, 0, 0.8));
      transform-origin: 0 0;
      transform: scale(var(--slide-scale));
      display: block;
      min-width: var(--slide-collect-width);
    }

    :host(.list) ::slotted(section *),
    :host(.list) ::slotted(.slide *) {
      pointer-events: none;
    }

    :host(.list) {
      padding: calc(var(--slide-collect-gap) * var(--slide-scale));
      box-sizing: border-box;
      width: 100%;
      display: grid;
      grid-gap: calc(var(--slide-collect-gap) * var(--slide-scale));
      grid-auto-rows: calc(var(--slide-collect-height) * var(--slide-scale));
      grid-template-rows: min-content;
      grid-template-columns: repeat(
        auto-fill,
        calc(var(--slide-collect-width) * var(--slide-scale))
      );
      background-color: var(--slide-collect-list-bg-color);
      /*overflow-x: hidden;*/
    }

    :host(.list) .dd-caption,
    :host(.list) .dd-caption-custom {
      grid-column: 1 / -1;
      margin-top: calc(-1 * var(--slide-collect-gap) * var(--slide-scale));
      margin-left: calc(-1 * var(--slide-collect-gap) * var(--slide-scale));
      box-sizing: border-box;
      width: 100vw;
    }

    /* IE & Edge Fix */

    :host(.list):not(.dd-caption):not(.dd-caption-custom) {
      position: absolute;
      clip: rect(0, auto, auto, 0);
    }

    /* Responsive */

    :host(.list) {
      --slide-scale: 0.25;
    }

    @media (min-width: 1168px) {
      :host(.list) {
        --slide-scale: 0.5;
      }
    }

    @media (min-width: 2336px) {
      :host(.list) {
        --slide-scale: 1;
      }
    }

    @media (max-width: 1168px) {
      :host {
        --caption-font-size: calc(1.3 * var(--slide-collect-font-size));
      }
    }
    @media (max-width: 700px) {
      :host {
        --caption-font-size: calc(1.1 * var(--slide-collect-font-size));
      }
    }

    /* Caption */

    .dd-caption {
      width: 100%;
      position: relative;
      display: flex;
      flex-direction: row;
      z-index: 1;
      color: var(--caption-fg-color);
      background-color: var(--caption-bg-color);
      height: var(--caption-height);
    }

    .dd-caption-item {
      font-size: var(--caption-font-size);
    }

    .dd-caption-left {
      flex-grow: 1;
      text-align: left;
      align-self: center;
      padding: var(--caption-padding-top) 0 var(--caption-padding-bottom)
        var(--caption-padding-left);
    }

    .dd-caption-center {
      flex-grow: 6;
      text-align: left;
      max-width: var(--caption-center-width);
      padding: var(--caption-padding-top) var(--caption-padding-right)
        var(--caption-padding-bottom) var(--caption-padding-left);
    }

    .dd-caption-title {
      padding-top: 20px;
      line-height: 1em;
      font-size: var(--caption-font-size);
      font-weight: 300;
    }

    .dd-caption-subtitle {
      padding-top: 20px;
      line-height: 1em;
      font-size: calc(0.55 * var(--caption-font-size));
      color: var(--caption-color-subtitle, rgba(255, 255, 255, 0.7));
    }

    .dd-caption-right {
      flex-grow: 1;
      text-align: right;
      font-size: calc(0.35 * var(--caption-font-size));
      align-self: flex-end;
      padding: var(--caption-padding-top) var(--caption-padding-right)
        var(--caption-padding-bottom) 0;
    }

    img.caption-img {
      height: var(--caption-img-height);
      display: block;
    }

    .caption-url {
      /*text-decoration: none;*/
      color: var(--caption-fg-color);
    }

    .dd-slide-collect-org-url {
      color: var(--slide-collect-text-color-light);
    }

    /* do not show custom caption slot */
    .dd-caption-custom {
      width: 100%;
      z-index: 1;
    }

    /* Print */

    @media print {
      :host(.full) {
        display: inline;
      }

      :host(.full) ::slotted(section),
      :host(.full) ::slotted(.slide) {
        position: relative;
        margin-left: 0 !important;
        margin-top: 0 !important;
        margin-bottom: 0 !important;
        transform: none;
      }
    }
  `;

  /**
   * Main presentation title
   *
   * **Corresponding attribute:** `main-title`
   *
   * **Default value:** `""` (empty string)
   */
  @property({ type: String, attribute: 'main-title' })
  mainTitle = DEFAULT_ATTRIBUTES.mainTitle;

  /**
   * Presentation subtitle
   *
   * **Corresponding attribute:** `sub-title`
   *
   * **Default value:** `""` (empty string)
   */
  @property({ type: String, attribute: 'sub-title' })
  subTitle = DEFAULT_ATTRIBUTES.subTitle;

  /**
   * Presentation author
   *
   * **Corresponding attribute:** `author`
   *
   * **Default value:** `""` (empty string)
   */
  @property({ type: String, attribute: 'author' })
  author = DEFAULT_ATTRIBUTES.author;

  /**
   * Presentation date
   *
   * **Corresponding attribute:** `date`
   *
   * **Default value:** `""` (empty string)
   */
  @property({ type: String, attribute: 'date' })
  date = DEFAULT_ATTRIBUTES.date;

  /**
   * Url (hyperlink) to _show_ inside the caption
   *
   * **Corresponding attribute:** `url`
   *
   * **Default value:** `""` (empty string)
   */
  @property({ type: String, attribute: 'url' })
  url = DEFAULT_ATTRIBUTES.url;

  /**
   * Hyperlink behind caption image (e.g. logo)
   *
   * **Corresponding attribute:** `img-url`
   *
   * **Default value:** `""` (empty string)
   */
  @property({ type: String, attribute: 'img-url' })
  imgUrl = DEFAULT_ATTRIBUTES.imgUrl;

  /**
   * Image source for caption image (e.g. logo)
   *
   * **Corresponding attribute:** `img-src`
   *
   * **Default value:** `""` (empty string)
   */
  @property({ type: String, attribute: 'img-src' })
  imgSrc = DEFAULT_ATTRIBUTES.imgSrc;

  /**
   * Name of organisation
   *
   * **Corresponding attribute:** `organisation`
   *
   * **Default value:** `""` (empty string)
   */
  @property({ type: String, attribute: 'organisation' })
  organisation = DEFAULT_ATTRIBUTES.organisation;

  /**
   * Hyperlink to organisation
   *
   * **Corresponding attribute:** `organisation-url`
   *
   * **Default value:** `""` (empty string)
   */
  @property({ type: String, attribute: 'organisation-url' })
  organisationUrl = DEFAULT_ATTRIBUTES.organisationUrl;

  /**
   * Path to JSON config file (corresponding inline attributes will
   * **overwrite** attributes defined in JSON config
   *
   * **Corresponding attribute:** `config-path`
   *
   * **Default value:** `""` (empty string)
   */
  @property({ type: String, attribute: 'config-path' })
  jsonConfig = DEFAULT_ATTRIBUTES.configPath;

  /**
   * Timout (in ms) for the cursor to auto-hide
   *
   * **Corresponding attribute:** `cursor-timeout`
   *
   * **Default value:** `3000` (milliseconds)
   */
  @property({ type: Number, attribute: 'cursor-timeout' })
  cursorTimeout = DEFAULT_ATTRIBUTES.cursorTimeout;

  /** @ignore */
  @property({ type: Boolean, attribute: 'full' })
  full = DEFAULT_ATTRIBUTES.full;

  /**
   * Factor for presenting in full screen mode (e.g. 0.8 will render the `full`
   * slide at 80% of the maximum screen size)
   *
   * **Corresponding attribute:** `full-scale-factor`
   *
   * **Default value:** `1`
   */
  @property({ type: Number, attribute: 'full-scale-factor' })
  fullScaleFactor = DEFAULT_ATTRIBUTES.fullScaleFactor;

  /** @ignore */
  @property({ type: Boolean, attribute: false })
  goToPrint = false;

  constructor() {
    super();
    this.addEventListener('mousemove', () => {
      if (this.cursorTimeout !== 0) {
        this.style.cursor = 'default';
        if (CURSOR_TIMER) clearTimeout(CURSOR_TIMER);
        CURSOR_TIMER = setTimeout(() => {
          this.style.cursor = 'none';
        }, this.cursorTimeout);
      }
    });
  }

  async setPropsFromJson() {
    const jsonObj = await getJsonConfig(this.jsonConfig);
    if (jsonObj.error)
      this.mainTitle = `<i><b>[ERROR]</b>${jsonObj.error} </i>`;
    else {
      if (jsonObj.title) this.mainTitle = jsonObj.title;
      if (jsonObj.mainTitle) this.mainTitle = jsonObj.mainTitle;
      if (jsonObj.subTitle) this.subTitle = jsonObj.subTitle;
      if (jsonObj.author && this.author === DEFAULT_ATTRIBUTES.author)
        this.author = jsonObj.author;
      if (jsonObj.date) this.date = jsonObj.date;
      if (jsonObj.url) this.url = jsonObj.url;
      if (jsonObj.imgUrl) this.imgUrl = jsonObj.imgUrl;
      if (jsonObj.imgSrc) this.imgSrc = jsonObj.imgSrc;
      if (jsonObj.organisation) this.organisation = jsonObj.organisation;
      if (jsonObj.organisationUrl)
        this.organisationUrl = jsonObj.organisationUrl;
    }
  }

  makeCaptionHeader(customHtml = '') {
    let ddImgElem = '';
    if (this.imgSrc)
      ddImgElem = `<a class="caption-link"
          href="${this.imgUrl}"
          target="_blank"
          title="Click to see IMG link">
          <img class="caption-img" src="${this.imgSrc}" alt="img-src"></a>`;

    let organisationEl = `${this.organisation}`;
    if (this.organisationUrl)
      organisationEl = `<a href="${this.organisationUrl}"
                           title="Organisation (click for link)"
                           class="dd-slide-collect-org-url">${this.organisation}</a>`;

    let captionUrlEl = '';
    if (this.url)
      captionUrlEl = `
      <a class="caption-url" href="${this.url}" target="_blank">
          <i>${this.url}</i>
      </a>`;

    if (customHtml)
      return `
        <div class="dd-caption-custom">
          ${customHtml}
        </div>
        `;
    return `
        <header class="dd-caption">
          <div class="dd-caption-item dd-caption-left">
            ${ddImgElem}
          </div>
          <div class="dd-caption-item dd-caption-center">
            <div class="dd-caption-title">
              ${this.mainTitle}<br>
            </div>
            <div class="dd-caption-subtitle">
              <i>${this.subTitle}</i>
            </div>
          </div>
          <div class="dd-caption-item dd-caption-right">
            <span>${this.date}</span><br>
            <strong>${this.author}</strong><br>
            <span>${organisationEl}</span><br>
            ${captionUrlEl}
          </div>
        </header>
      `;
  }

  /* c8 ignore next 75 */
  private _updateView = (toggleView = false) => {
    if (this.goToPrint) return;

    if (toggleView) this.full = !this.full;

    // caption
    const captionElem = this.shadowRoot!.querySelector('.dd-caption');
    if (captionElem)
      if (this.full) (captionElem as HTMLElement).style.display = 'none';
      else (captionElem as HTMLElement).style.display = 'flex';

    // external engine
    const externalEngine = document.querySelector('.shower');
    if (externalEngine) {
      if (this.full) this.classList.remove('list');
      else this.classList.add('list');
      return;
    }

    // switch between full and list
    if (this.full) {
      this.classList.add('full');
      this.classList.remove('list');

      const { innerWidth, innerHeight } = window;
      // any slide
      const slide = document.querySelector('.slide');
      if (slide) {
        const { offsetWidth, offsetHeight } = slide as HTMLElement;
        const scale =
          (1 / Math.max(offsetWidth / innerWidth, offsetHeight / innerHeight)) *
          this.fullScaleFactor;
        this.style.setProperty('--slide-collect-full-scale-factor', `${scale}`);
        const offset = (innerHeight - offsetHeight * scale) / 2;
        // all slides
        const slideElems = document.querySelectorAll('.slide');
        this.style.height = `${slideElems.length * innerHeight}px`;
        for (const [idx, slideElem] of slideElems.entries()) {
          slideElem.id = `${idx + 1}`;
          (slideElem as HTMLElement).style.marginTop = `
              ${innerHeight * idx + offset}px`;
          (slideElem as HTMLElement).style.marginLeft = `
              ${(innerWidth - offsetWidth * scale) / 2}px`;
          if (idx === slideElems.length - 1)
            (slideElem as HTMLElement).style.marginBottom = `${offset}px`;
        }
      }
    } else {
      this.classList.add('list');
      this.classList.remove('full');
      this.style.height = 'auto';

      const slideElems = document.querySelectorAll('.slide');
      for (const slideElem of slideElems) {
        (slideElem as HTMLElement).style.marginTop = `0px`;
        (slideElem as HTMLElement).style.marginLeft = `0px`;
      }
    }

    // update url
    // WARNING: need to be carefull with pushState event triggers
    // (alternaive?)
    const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    if (this.full)
      window.history.pushState({ fullPage: true }, 'Slide', `${baseUrl}?full`);
    else window.history.pushState({ fullPage: true }, 'Slide', `${baseUrl}`);

    // update style
    this._updateStyle();
  };

  /* c8 ignore next 13 */
  private _handleSlideClick = () => {
    const slideElems = document.querySelectorAll('.slide');
    for (const [idx, elem] of slideElems.entries()) {
      (elem as HTMLElement).addEventListener('click', () => {
        if (!this.full) {
          this._updateView(true);
          if (document.querySelector('.shower')) return;

          window.scrollBy(0, window.innerHeight * idx);
          window.location.hash = `#${idx + 1}`;
        }
      });
    }
  };

  /* c8 ignore next 5 */
  private _handleResize = () => {
    if (document.querySelector('.shower')) return;
    this._updateView();
  };

  /* c8 ignore next 14 */
  private _handleLocation = () => {
    // shower framework related behavior
    const urlString = window.location.href;
    const paramString = urlString.split('?')[1];
    const queryString = new URLSearchParams(paramString);
    for (const pair of queryString.entries()) {
      if (pair[0].includes('full')) {
        if (!this.full) this._updateView(true);
        break;
      }
    }
  };

  /* c8 ignore next 13 */
  private _handleScroll = () => {
    // external framework
    if (document.querySelector('.shower')) return;
    if (this.goToPrint) return;

    if (this.full) {
      const scrollHeight = document.documentElement.scrollTop;
      const idx = Math.floor(scrollHeight / window.innerHeight);
      // window.location.hash = `#${idx+1}`;
      window.history.pushState(null, '', `?full#${idx + 1}`);
    }
  };

  /* c8 ignore next 48 */
  private _interactKeys = () => {
    document.onkeydown = (e: KeyboardEvent) => {
      const evt = e || window.event;
      // on escape, go back to list
      const ddAction = !(evt.ctrlKey || evt.altKey || evt.metaKey);
      if (ddAction) {
        switch (evt.key.toUpperCase()) {
          case 'ESC':
          case 'ESCAPE':
            if (this.full) {
              evt.preventDefault();
              this._updateView(true);
            }
            break;
          case 'BACKSPACE':
          case 'PAGEUP':
          case 'ARROWUP':
          case 'ARROWLEFT':
          case 'P':
            if (this.full) {
              evt.preventDefault();
              window.scrollBy(0, -window.innerHeight);
            }
            break;
          case 'PAGEDOWN':
          case 'ARROWDOWN':
          case 'ARROWRIGHT':
          case 'N':
            if (this.full) {
              evt.preventDefault();
              window.scrollBy(0, window.innerHeight);
            }
            break;
          case ' ':
            if (this.full) {
              evt.preventDefault();
              if (evt.shiftKey) window.scrollBy(0, -window.innerHeight);
              else window.scrollBy(0, window.innerHeight);
            }
            break;
          default:
        }
      }
    };
  };

  private _updateStyle = () => {
    if (this.full) this.parentElement!.style.backgroundColor = 'rgba(0,0,0,1)';
    else this.parentElement!.style.backgroundColor = '';
  };

  connectedCallback() {
    super.connectedCallback();
    // on slide click (from list), check if url changes to full
    window.addEventListener('DOMContentLoaded', this._handleSlideClick);
    window.addEventListener('DOMContentLoaded', this._handleLocation);
    window.addEventListener('resize', this._handleResize);
    document.addEventListener('scroll', this._handleScroll);
    window.addEventListener('beforeprint', () => {
      /* c8 ignore next 2 */
      // how to test?
      this.goToPrint = true;
    });
    window.addEventListener('afterprint', () => {
      /* c8 ignore next 2 */
      // how to test?
      this.goToPrint = false;
    });
  }

  disconnectedCallback() {
    window.removeEventListener('DOMContentLoaded', this._handleSlideClick);
    window.removeEventListener('DOMContentLoaded', this._handleLocation);
    window.removeEventListener('resize', this._handleResize);
    document.removeEventListener('scroll', this._handleScroll);
    window.removeEventListener('beforeprint', () => {
      /* c8 ignore next 2 */
      // how to test?
      this.goToPrint = true;
    });
    window.removeEventListener('afterprint', () => {
      /* c8 ignore next 2 */
      // how to test?
      this.goToPrint = false;
    });
    super.disconnectedCallback();
  }

  async firstUpdated() {
    if (this.full) this.classList.add('full');
    else this.classList.add('list');

    const externalEngine = document.querySelector('.shower');
    // parentElem margin to zero
    if (!externalEngine) this.parentElement!.style.margin = '0';

    this._interactKeys();
    this._updateStyle();
  }

  render() {
    let htmlContent = '';

    if (this.jsonConfig) this.setPropsFromJson();

    const customCaptionElem = this.querySelector('[slot="caption"]');
    if (customCaptionElem) {
      htmlContent += this.makeCaptionHeader(customCaptionElem.innerHTML);
      (customCaptionElem as HTMLElement).style.display = 'none';
    } else htmlContent += this.makeCaptionHeader();

    // slot for custom caption
    htmlContent += '<slot name="caption"></slot>';

    // default slot for slides
    htmlContent += '<slot></slot>';

    /* loop over children */
    const wrongSlideElements = this.querySelectorAll(
      'dd-slide-collection > *:not(.slide):not([slot="caption"]):not(section)'
    );

    for (const wrongElem of wrongSlideElements)
      wrongElem.innerHTML = insertHtmlWrongElem(wrongElem as HTMLElement);

    return html`${unsafeHTML(htmlContent)}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dd-slide-collection': DdSlideCollection;
  }
}
