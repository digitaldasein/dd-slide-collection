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
  "author" : "",
  "mainTitle": "dummy-title",
  "subTitle": "",
  "date": "",
  "urlLogo": "",
  "url": "",
  "imgSrc": "",
  "organisation": "",
  "organisationUrl": "",
  "full": false,
  "fullScaleFactor": 1,
  "configPath": ""
}

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

async function getJsonConfig (url:string)  {
  /* first check head to see if file exists (no need to fetch whole file if
   * when looping over multiple possible filepaths */
  const _checkFileExists = async (urlCheck:string) => {
    const response = await fetch(urlCheck, { method: "HEAD" });
    if ( response.status !== 404 ) {
      return true;
    }

    console.error(`JSON config does not exist at '${urlCheck}'`);
    return false;
  }

  const bFile = await _checkFileExists(url);

  if ( bFile ) {
    try {
      const response = await fetch(url);
      const json = await response.json();
      return json;
    }
    catch (err: any){
      console.error(`Error while reading config file at ${url} \n\n ${err}`)
    }
  }

  return {
    "error": "Could not parse JSON config, see console for errors"
  };
}


/*---------------------------------------------------------------------*/
/* Main                                                                */
/*---------------------------------------------------------------------*/

export class DdSlideCollection extends LitElement {
  static styles = css`


    :host {
      /* Ddpres fillers */

      /* dd color pallette */
      --slide-collect-prim-color: var(--dd-prim-color, rgba(153, 155, 132, 1));
      --slide-collect-prim-color-alpha: var(--dd-prim-color, rgba(153, 155, 132, 0.5));
      --slide-collect-prim-color-dark: var(--dd-prim-color-dark, rgba(65, 90, 72, 1));
      --slide-collect-sec-color: var(--dd-sec-color, rgba(248, 237, 227, 1));
      --slide-collect-sec-color-alpha: var(--dd-sec-color, rgba(248, 237, 227, 0.5));
      --slide-collect-sec-color-dark: var(--dd-sec-color-dark, rgba(238, 254, 216, 1));
      --slide-collect-text-color: var(--dd-text-color, rgba(0, 0, 0, 0.9));
      --slide-collect-text-color-light: var(--dd-text-color-light, rgba(255, 255, 255, 1));

      --slide-collect-gap: var(--dd-slide-gap, 96px);
      --slide-collect-ratio: var(--dd-slide-ratio, calc(16 / 9));
      --slide-collect-width: var(--dd-slide-width, 1024px);
      --slide-collect-height: var(--dd-slide-height, calc(var(--slide-collect-width) / var(--slide-collect-ratio)));
      --slide-collect-full-scale: var(--dd-full-scale, 1);
      --slide-collect-font: var(--dd-font, 24px/2 'Roboto', sans-serif);
      --slide-collect-font-size: var(--dd-font-size, 24px);

      --caption-height: var(--dd-caption-height, 250px);
      --caption-center-width: 60%;
      --caption-font-size: calc(1.8 * var(--slide-collect-font-size)) ;
      --caption-padding-left: 30px;
      --caption-padding-top: 30px;
      --caption-padding-right: 30px;
      --caption-padding-bottom: 30px;
      --caption-img-height: calc(0.60 * var(--caption-height));
      --caption-fg-color: white;
      --caption-bg-color: var(--slide-collect-prim-color-dark, blue);

      --slide-collect-slide-nr-font-size: var(--dd-slide-nr-font-size, 16px);
      --slide-collect-slide-nr-right: var(--dd-slide-nr-right, 13px);
      --slide-collect-slide-nr-bottom: calc(
            var(--dd-slide-nr-bottom, 0.2em) +
            var(--dd-footer-bottom, var(--progress-size, 0em) )
        );
      --slide-collect-slide-nr-color: var(--dd-slide-nr-color, var(--slide-collect-text-color));

      --slide-scale: 1;

      margin: 0;
      padding:0;
      color: black;
      counter-reset: slide;

      font: var(--slide-collect-font);
      font-size: var(--slide-collect-font-size);

    }

    /* Full */

    :host(.full) {
      display:block;
    }

    /* Hover */

    :host(.list) ::slotted(section:hover),
    :host(.list) ::slotted(.slide:hover) {
      box-shadow: 0 0 0 20px var(--slide-collect-prim-color);
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
      /*margin-bottom: var(--slide-collect-gap)*/;
    }

    :host(.full) ::slotted(section),
    :host(.full) ::slotted(.slide) {
      position: absolute;
      transform-origin: 0 0;
      transform: scale(var(--slide-collect-full-scale));
      border: 1px solid black;
    }

    /* Number */

    ::slotted(section)::after,
    ::slotted(.slide)::after {
      position: absolute;
      font-size: var(--slide-collect-slide-nr-font-size);
      right: var(--slide-collect-slide-nr-right);
      bottom: calc( var(--slide-collect-slide-nr-bottom) );
      left: 0px;
      color: var(--slide-collect-slide-nr-color);
      text-align: right;
      counter-increment: slide;
      content: counter(slide);
      z-index:2;
    }

    /* List */

    :host(.list) ::slotted(.slide),
    :host(.list) ::slotted(section) {
      position: relative;
      box-shadow: calc(var(--slide-scale) * 4px) calc(var(--slide-scale) * 4px)
                  0 calc(var(--slide-scale) * 4px) var(--slide-collect-prim-color-dark);
      transform-origin: 0 0;
      transform: scale(var(--slide-scale));
      display:block;
      min-width: var(--slide-collect-width);
    }

    :host(.list) ::slotted(section *),
    :host(.list) ::slotted(.slide *) {
      pointer-events: none;
    }

    :host(.list)  {
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
      background-color: var(--slide-collect-sec-color-alpha);
      /*overflow-x: hidden;*/
    }

    :host(.list) .dd-caption,
    :host(.list) .dd-caption-custom {
      grid-column: 1 / -1;
      margin-top: calc( -1 * var(--slide-collect-gap) * var(--slide-scale) );
      margin-left: calc( -1 * var(--slide-collect-gap) * var(--slide-scale) );
      box-sizing: border-box;
      width: 100vw;
    }

    /* IE & Edge Fix */

    :host(.list):not(.dd-caption):not(.dd-caption-custom){
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
        --caption-font-size: calc( 1.3 * var(--slide-collect-font-size) ) ;
      }
    }
    @media (max-width: 700px) {
      :host {
        --caption-font-size: calc( 1.1 * var(--slide-collect-font-size) ) ;
      }
    }

    /* Caption */

    .dd-caption {
      width:100%;
      position: relative;
      display:flex;
      flex-direction:row;
      z-index:1;
      color: var(--caption-fg-color);
      background-color: var(--caption-bg-color);
      height:var(--caption-height);
    }

    .dd-caption-item {
      font-size: var(--caption-font-size);
    }

    .dd-caption-left {
      flex-grow:1;
      text-align: left;
      align-self: center;
      padding: var(--caption-padding-top)
               0
               var(--caption-padding-bottom)
               var(--caption-padding-left);
    }

    .dd-caption-center {
      flex-grow: 6;
      text-align: left;
      max-width:var(--caption-center-width);
      padding: var(--caption-padding-top)
               var(--caption-padding-right)
               var(--caption-padding-bottom)
               var(--caption-padding-left);

    }

    .dd-caption-title {
      padding-top:20px;
      line-height:1em;
      font-size: var(--caption-font-size);
      font-weight:300;
    }

    .dd-caption-subtitle{
      padding-top:20px;
      line-height:1em;
      font-size: calc( 0.7 * var(--caption-font-size )  );
      color:var(--caption-color-subtitle, rgba(255, 255, 255, 0.7));
    }

    .dd-caption-right {
      flex-grow:1;
      text-align:right;
      font-size: calc( 0.45 * var(--caption-font-size )  );
      align-self: flex-end;
      padding: var(--caption-padding-top)
               var(--caption-padding-right)
               var(--caption-padding-bottom)
               0;

    }

    img.caption-img {
      height: var(--caption-img-height);
      display:block;
    }

    .caption-url {
      /*text-decoration: none;*/
      color:var(--caption-fg-color);
    }

    .dd-slide-collect-org-url {
      color:var(--slide-collect-text-color-light);
    }

    /* do not show custom caption slot */
    .dd-caption-custom {
      width:100%;
      z-index:1;
    }

    /* Print */

    @media print {
      :host(.full) {
        display:inline;
      }

      :host(.full) ::slotted(section),
      :host(.full) ::slotted(.slide) {
        position:relative;
        margin-left:0 !important;
        margin-top:0 !important;
        margin-bottom:0 !important;
        transform: none;
      }
    }
    `;

  @property( {type:String, attribute: 'main-title' })
  mainTitle = DEFAULT_ATTRIBUTES.mainTitle;

  @property( {type:String, attribute: 'sub-title' })
  subTitle = DEFAULT_ATTRIBUTES.subTitle;

  @property( {type:String, attribute: 'author' })
  author = DEFAULT_ATTRIBUTES.author;

  @property( {type:String, attribute: 'date' })
  date = DEFAULT_ATTRIBUTES.date;

  @property( {type:String, attribute: 'url' })
  url = DEFAULT_ATTRIBUTES.url;

  @property( {type:String, attribute: 'url-logo' })
  urlLogo = DEFAULT_ATTRIBUTES.urlLogo;

  @property( {type:String, attribute: 'img-src' })
  imgSrc = DEFAULT_ATTRIBUTES.imgSrc;

  @property( {type:String, attribute: 'organisation' })
  organisation = DEFAULT_ATTRIBUTES.organisation;

  @property( {type:String, attribute: 'organisation-url' })
  organisationUrl = DEFAULT_ATTRIBUTES.organisationUrl;

  @property( {type:String, attribute: 'config-path' })
  jsonConfig = DEFAULT_ATTRIBUTES.configPath;

  @property( {type:Boolean, attribute: 'full' })
  full = DEFAULT_ATTRIBUTES.full;

  @property( {type:Number, attribute: 'full-scale-factor' })
  fullScaleFactor = DEFAULT_ATTRIBUTES.fullScaleFactor;

  @property({ type:Boolean, attribute: false })
  goToPrint = false;

  async setPropsFromJson(){
    const jsonObj = await getJsonConfig(this.jsonConfig);
    if ( jsonObj.error )
        this.mainTitle = `<i><b>[ERROR]</b>${jsonObj.error} </i>`;
    else {
      if ( jsonObj.title )
        this.mainTitle = jsonObj.title
      if ( jsonObj.mainTitle )
        this.mainTitle = jsonObj.mainTitle
      if ( jsonObj.subTitle )
        this.subTitle = jsonObj.subTitle
      if ( jsonObj.author && this.author ===  DEFAULT_ATTRIBUTES.author)
        this.author = jsonObj.author
      if ( jsonObj.date )
        this.date = jsonObj.date
      if ( jsonObj.url )
        this.url = jsonObj.url
      if ( jsonObj.urlLogo )
        this.urlLogo = jsonObj.urlLogo
      if ( jsonObj.imgSrc )
        this.imgSrc = jsonObj.imgSrc
      if ( jsonObj.organisation )
        this.organisation = jsonObj.organisation
      if ( jsonObj.organisationUrl )
        this.organisationUrl = jsonObj.organisationUrl
    }
  }

  makeCaptionHeader(customHtml=""){
    let ddImgElem = "";
    if ( this.imgSrc )
      ddImgElem =
      `<a class="caption-link"
          href="${this.urlLogo}"
          target="_blank"
          title="Click to see IMG link">
          <img class="caption-img" src="${this.imgSrc}" alt="img-src"></a>`;

    let organisationEl = `${this.organisation}`;
    if ( this.organisationUrl )
      organisationEl = `<a href="${this.organisationUrl}"
                           title="Organisation (click for link)"
                           class="dd-slide-collect-org-url">${this.organisation}</a>`;

    let captionUrlEl = "";
    if ( this.url )
      captionUrlEl = `
      <a class="caption-url" href="${this.url}" target="_blank">
          <i>${this.url}</i>
      </a>`;

    if ( customHtml )
      return `
        <div class="dd-caption-custom">
          ${customHtml}
        </div>
        `
    return `
        <header class="dd-caption" title="Slide collection caption">
          <div class="dd-caption-item dd-caption-left">
            ${ddImgElem}
          </div>
          <div class="dd-caption-item dd-caption-center">
            <div class="dd-caption-title" title="Title">
              ${this.mainTitle}<br>
            </div>
            <div class="dd-caption-subtitle" title="Subtitle">
              <i>${this.subTitle}</i>
            </div>
          </div>
          <div class="dd-caption-item dd-caption-right">
            <span title="Date">${this.date}</span><br>
            <strong title="Author(s)">${this.author}</strong><br>
            <span title="Organisation">${organisationEl}</span><br>
            ${captionUrlEl}
          </div>
        </header>
      `;
  }

  /* c8 ignore next 73 */
  private _updateView = (toggleView=false) => {

    if ( this.goToPrint ) return;

    if ( toggleView )
      this.full = !this.full;

    // caption
    const captionElem = this.shadowRoot!.querySelector('.dd-caption');
    if ( captionElem )
      if ( this.full ) (captionElem as HTMLElement).style.display = "none";
      else  (captionElem as HTMLElement).style.display = "flex";

    // external engine
    const externalEngine = document.querySelector('.shower');
      if ( externalEngine ) {
        if ( this.full )
          this.classList.remove("list");
        else this.classList.add("list");
        return;
    };

    // switch between full and list
    if ( this.full ){
      this.classList.add("full");
      this.classList.remove("list");

      const { innerWidth, innerHeight } = window;
      // any slide
      const slide = document.querySelector(".slide");
      if ( slide ){
        const { offsetWidth, offsetHeight } = slide as HTMLElement;
        const scale = 1 / Math.max(
            offsetWidth / innerWidth,
            offsetHeight / innerHeight
            ) * this.fullScaleFactor;
        this.style.setProperty('--slide-collect-full-scale', `${scale}`);
        const offset = (innerHeight - offsetHeight*scale) / 2;
        // all slides
        const slideElems = document.querySelectorAll(".slide");
        this.style.height = `${slideElems.length * innerHeight}px`;
        for( const [idx, slideElem] of slideElems.entries() ) {
          slideElem.id = `${idx + 1}`;
          (slideElem as HTMLElement).style.marginTop = `
              ${innerHeight * idx + offset}px`;
          (slideElem as HTMLElement).style.marginLeft = `
              ${(innerWidth - offsetWidth*scale)/2}px`;
          if ( idx === (slideElems.length -1) )
            (slideElem as HTMLElement).style.marginBottom = `${offset}px`;
        }
      }
    }
    else {
      this.classList.add("list");
      this.classList.remove("full");
      this.style.height = "auto";

      const slideElems = document.querySelectorAll(".slide");
      for( const slideElem of slideElems ) {
        (slideElem as HTMLElement).style.marginTop = `0px`;
        (slideElem as HTMLElement).style.marginLeft = `0px`;
      }
    }

    // update url
    const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    if ( this.full )
      window.history.pushState({fullPage:true}, "Slide", `${baseUrl}?full`)
    else
    window.history.pushState({fullPage:true}, "Slide", `${baseUrl}`)

    // update style
    this._updateStyle();
  }

  /* c8 ignore next 13 */
  private _handleSlideClick = () => {
    const slideElems = document.querySelectorAll('.slide');
    for( const [idx, elem] of slideElems.entries() ) {
      (elem as HTMLElement).addEventListener('click', () => {
        if ( !this.full ){
          this._updateView(true);
          if ( document.querySelector('.shower') ) return;

          window.scrollBy(0, window.innerHeight * idx);
          window.location.hash = `#${idx + 1}`;
        }
      })
    }
  }

  /* c8 ignore next 5 */
  private _handleResize = () => {
    if ( document.querySelector('.shower') ) return;
    this._updateView()
  }


  /* c8 ignore next 13 */
  private _handleLocation = () => {
    // shower framework related behavior
    const urlString = window.location.href;
    const paramString = urlString.split('?')[1];
    const queryString = new URLSearchParams(paramString);
    for( const pair of queryString.entries() ) {
      if ( pair[0].includes("full") ){
        if ( !this.full )
          this._updateView(true);
        break;
      }
    }
  }

  /* c8 ignore next 11 */
  private _handleScroll = () => {
    // external framework
    if ( document.querySelector('.shower') ) return;
    if ( this.goToPrint ) return;

    if ( this.full ){
      const scrollHeight = document.documentElement.scrollTop;
      const idx = Math.floor(scrollHeight  / window.innerHeight);
      // window.location.hash = `#${idx+1}`;
      window.history.pushState(null, '', `?full#${idx + 1}`)
    }
  }

  /* c8 ignore next 48 */
  private _interactKeys = () => {
    document.onkeydown = (e:KeyboardEvent) => {
      const evt = e || window.event;
      // on escape, go back to list
      const ddAction = !(evt.ctrlKey || evt.altKey || evt.metaKey);
      if ( ddAction ){
        switch (evt.key.toUpperCase()) {
            case 'ESC':
            case 'ESCAPE':
              if ( this.full ){
                evt.preventDefault();
                this._updateView(true);
              }
              break;
            case 'BACKSPACE':
            case 'PAGEUP':
            case 'ARROWUP':
            case 'ARROWLEFT':
            case 'P':
              if ( this.full ){
                evt.preventDefault();
                window.scrollBy(0, -window.innerHeight);
              }
              break;
            case 'PAGEDOWN':
            case 'ARROWDOWN':
            case 'ARROWRIGHT':
            case 'N':
              if ( this.full ){
                evt.preventDefault();
                window.scrollBy(0, window.innerHeight);
              }
              break;
            case ' ':
                if ( this.full ) {
                    evt.preventDefault();
                    if (evt.shiftKey) window.scrollBy(0, -window.innerHeight);
                    else window.scrollBy(0, window.innerHeight);
                }
                break;
            default:
        }
      }
    }
  }

  private _updateStyle = () => {
    if ( this.full )
      this.parentElement!.style.backgroundColor = "rgba(0,0,0,1)";
    else
      this.parentElement!.style.backgroundColor = "";
  }

  connectedCallback() {
    super.connectedCallback();
    // on slide click (from list), check if url changes to full
    window.addEventListener("DOMContentLoaded", this._handleSlideClick );
    window.addEventListener("DOMContentLoaded", this._handleLocation );
    window.addEventListener("resize", this._handleResize );
    document.addEventListener("scroll", this._handleScroll );
    window.addEventListener('beforeprint', () => { this.goToPrint = true; });
    window.addEventListener('afterprint', () => { this.goToPrint = false; });
  }

  disconnectedCallback() {
    window.removeEventListener('DOMContentLoaded', this._handleSlideClick);
    window.removeEventListener('DOMContentLoaded', this._handleLocation);
    window.removeEventListener("resize", this._handleResize );
    document.removeEventListener("scroll", this._handleScroll );
    window.removeEventListener('beforeprint', () => { this.goToPrint = true; });
    window.removeEventListener('afterprint', () => { this.goToPrint = false; });
    super.disconnectedCallback();
  }

  async firstUpdated() {
    if ( this.full ) this.classList.add("full");
    else this.classList.add("list");

    const externalEngine = document.querySelector('.shower');
    // parentElem margin to zero
    if ( !externalEngine )
      this.parentElement!.style.margin = "0";

    this._interactKeys();
    this._updateStyle();
  }

  render() {

    let htmlContent = "";

    if ( this.jsonConfig )
      this.setPropsFromJson()

    const customCaptionElem = this.querySelector('[slot="caption"]');
    if ( customCaptionElem ){
      htmlContent += this.makeCaptionHeader(customCaptionElem.innerHTML);
      (customCaptionElem as HTMLElement).style.display = "none";
    }
    else
      htmlContent += this.makeCaptionHeader();

    // slot for custom caption
    htmlContent += '<slot name="caption"></slot>';

    // default slot for slides
    htmlContent += '<slot></slot>';

    /* loop over children */
    const wrongSlideElements = this.querySelectorAll(
      'dd-slide-collection > *:not(.slide):not([slot="caption"]):not(section)'
    );

    for (const wrongElem of wrongSlideElements)
      wrongElem.innerHTML = insertHtmlWrongElem(wrongElem as HTMLElement)

    return html`${unsafeHTML(htmlContent)}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dd-slide-collection': DdSlideCollection;
  }
}
