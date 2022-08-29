// SPDX-FileCopyrightText: 2022 Digital Dasein <https://digital-dasein.gitlab.io/>
// SPDX-FileCopyrightText: 2022 Gerben Peeters <gerben@digitaldasein.org>
// SPDX-FileCopyrightText: 2022 Senne Van Baelen <senne@digitaldasein.org>
//
// SPDX-License-Identifier: MIT

import { html } from 'lit';
import { fixture, expect } from '@open-wc/testing';
import { DdSlideCollection } from '../src/DdSlideCollection.js';
import '../src/dd-slide-collection.js';

/*---------------------------------------------------------------------*/
/* Config                                                              */
/*---------------------------------------------------------------------*/

/*---------------------------------------------------------------------*/
/* Utils                                                               */
/*---------------------------------------------------------------------*/

function timeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/*---------------------------------------------------------------------*/
/* Test                                                                */
/*---------------------------------------------------------------------*/

describe('DdSlideCollection', () => {
  it('Make sure non-section elements trigger warning', async () => {
    const el = await fixture<DdSlideCollection>(html` <dd-slide-collection>
      <div></div>
    </dd-slide-collection>`);
    expect(el!.innerHTML.toUpperCase()).to.include('WARNING');
  });

  it('Slide collection as full', async () => {
    const el = await fixture<DdSlideCollection>(html` <dd-slide-collection full>
    </dd-slide-collection>`);
    // console.log(el.classList);
    // expect(el.shadowRoot!.querySelector(".list")).to.not.equal(null);
  });

  it('Organisation and corresponding URL rendering', async () => {
    const el = await fixture<DdSlideCollection>(html` <dd-slide-collection
      organisation="myOrg"
      organisation-url="http:myorg.org"
    >
    </dd-slide-collection>`);
    // console.log(el.classList);
    expect(el.shadowRoot!.querySelector('.list')).to.not.equal(null);
  });

  it('Hide custom caption slot', async () => {
    const el = await fixture<DdSlideCollection>(html` <dd-slide-collection>
      <div slot="caption">My custom caption</div>
    </dd-slide-collection>`);
    const hiddenEl = el.querySelector('div[slot="caption"]');
    expect((hiddenEl as HTMLElement)!.style.display).to.equal('none');
  });

  it('Allow custom caption creationg', async () => {
    const el = await fixture<DdSlideCollection>(html` <dd-slide-collection>
      <div slot="caption">My custom caption</div>
    </dd-slide-collection>`);
    const customElem = el.shadowRoot!.querySelector('div.dd-caption-custom');
    expect(customElem).to.not.equal(null);
  });

  it('Get config from JSON file', async () => {
    const response = await fetch('./test/data/config.json');
    const jsonConfig = await response.json();

    const el = await fixture<DdSlideCollection>(html` <dd-slide-collection
      config-path="/test/data/config.json"
    >
      <section></section>
    </dd-slide-collection>`);

    // wait to make sure data is fetched
    await timeout(100);
    const captionTitleHtml =
      el.shadowRoot!.querySelector('.dd-caption-title')!.innerHTML;
    expect(captionTitleHtml).to.include(jsonConfig.title);
  });

  it('Return error (as title) if JSON file does not exist', async () => {
    const el = await fixture<DdSlideCollection>(html` <dd-slide-collection
      config-path="/test/data/nonconfig.json"
    >
      <section></section>
    </dd-slide-collection>`);

    // wait to make sure data is fetched
    await timeout(100);
    const captionTitleHtml =
      el.shadowRoot!.querySelector('.dd-caption-title')!.innerHTML;
    expect(captionTitleHtml).to.include('ERROR');
  });

  it('Return error (as title) if JSON cannot be parsed', async () => {
    const el = await fixture<DdSlideCollection>(html` <dd-slide-collection
      config-path="/test/data/wrongconfig.json"
    >
      <section></section>
    </dd-slide-collection>`);

    // wait to make sure data is fetched
    await timeout(100);
    const captionTitleHtml =
      el.shadowRoot!.querySelector('.dd-caption-title')!.innerHTML;
    expect(captionTitleHtml).to.include('ERROR');
  });

  it('passes the a11y audit', async () => {
    const el = await fixture<DdSlideCollection>(html` <dd-slide-collection>
    </dd-slide-collection>`);
    await expect(el).shadowDom.to.be.accessible();
  });
});
