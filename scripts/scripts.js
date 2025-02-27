/* eslint-disable import/no-unresolved */
import {
  buildBlock,
  loadHeader,
  loadFooter,
  loadGeopopup,
  decorateBlock,
  loadBlock,
  decorateIcon,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  getMetadata,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  // loadScript,
  sampleRUM,
  // toCamelCase,
  // toClassName,
} from './aem.js';
// import initializeDropins from './dropins.js';
// eslint-disable-next-line import/no-cycle
import { trackHistory } from './commerce.js';
import { getCountries } from './configs.js';
// import { pageContextPush } from './datalayer.js';
// import { pageTypePushGtm } from './datalayer-vcgtm.js';
// import { addMagentoCacheListener } from './storage/util.js';

// const pageType = 'CMS';

// Define an execution context (FOR EXPERIMENTATION)
// const pluginContext = {
//   getAllMetadata,
//   getMetadata,
//   loadCSS,
//   loadScript,
//   sampleRUM,
//   toCamelCase,
//   toClassName,
// };

/**
 * Load fonts.css and set a session storage flag.
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  // await loadCSS('https://use.typekit.net/gyy3evs.css');
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

function swapIcon(icon) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(async (entry) => {
      if (entry.isIntersecting) {
        const resp = await fetch(icon.src);
        const temp = document.createElement('div');
        temp.innerHTML = await resp.text();
        const svg = temp.querySelector('svg');
        temp.remove();
        // check if svg has inline styles
        let style = svg.querySelector('style');
        if (style) style = style.textContent.toLowerCase().includes('currentcolor');
        let fill = svg.querySelector('[fill]');
        if (fill) fill = fill.getAttribute('fill').toLowerCase().includes('currentcolor');
        // replace image with SVG, ensuring color inheritance
        if ((style || fill) || (!style && !fill)) {
          icon.replaceWith(svg);
        }
        observer.disconnect();
      }
    });
  }, { threshold: 0 });
  observer.observe(icon);
}

/**
 * Replaces image icons with inline SVGs when they enter the viewport.
 */
export function swapIcons() {
  document.querySelectorAll('span.icon > img[src]').forEach((icon) => {
    swapIcon(icon);
  });
}

export function buildIcon(name, modifier) {
  const icon = document.createElement('span');
  icon.className = `icon icon-${name}`;
  if (modifier) icon.classList.add(modifier);
  decorateIcon(icon);
  return icon;
}

/**
 * Check if consent was given for a specific topic.
 * @param {*} topic Topic identifier
 * @returns {boolean} True if consent was given
 */
// eslint-disable-next-line no-unused-vars
export function getConsent(topic) {
  // eslint-disable-next-line no-console
  console.warn('getConsent not implemented');
  return true;
}

let MANUAL_BREADCRUMB;

async function loadBreadcrumb(main) {
  let wrapper;
  if (MANUAL_BREADCRUMB) {
    wrapper = MANUAL_BREADCRUMB.parentElement;
  } else if (getMetadata('breadcrumb') === 'auto') {
    wrapper = document.createElement('div');
    const block = buildBlock('breadcrumb', { elems: [document.createElement('ul')] });
    wrapper.append(block);
  } else {
    return;
  }
  main.append(wrapper);

  decorateBlock(wrapper.firstElementChild);
  await loadBlock(wrapper.firstElementChild);
}

function buildBreadcrumb(main) {
  if (getMetadata('breadcrumb') === 'none') {
    return;
  }

  if (getMetadata('breadcrumb') === 'auto') {
    main.classList.add('with-breadcrumb');
  } else if (document.querySelector('.breadcrumb')) {
    MANUAL_BREADCRUMB = document.querySelector('.breadcrumb');
    main.classList.add('with-breadcrumb');
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
// eslint-disable-next-line no-unused-vars
function buildAutoBlocks(main) {
  try {
    buildBreadcrumb(document.querySelector('header'));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates links with appropriate classes to style them as buttons
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    // identify standalone links
    if (a.href !== a.textContent && p.textContent.trim() === a.textContent.trim()) {
      a.className = 'button';
      const strong = a.closest('strong');
      const em = a.closest('em');
      const double = !!strong && !!em;
      if (double) a.classList.add('accent');
      else if (strong) a.classList.add('emphasis');
      else if (em) a.classList.add('outline');
      p.replaceChild(a, p.firstChild);
      p.className = 'button-wrapper';
    }
  });
  // collapse adjacent button wrappers
  const wrappers = main.querySelectorAll('p.button-wrapper');
  let previousWrapper = null;
  wrappers.forEach((wrapper) => {
    if (previousWrapper && previousWrapper.nextElementSibling === wrapper) {
      // move all buttons from the current wrapper to the previous wrapper
      previousWrapper.append(...wrapper.childNodes);
      // remove the empty wrapper
      wrapper.remove();
    } else previousWrapper = wrapper; // now set the current wrapper as the previous wrapper
  });
}

function decorateImages(main) {
  main.querySelectorAll('p img').forEach((img) => {
    const p = img.closest('p');
    p.className = 'img-wrapper';
  });
}

/**
 * Wraps images followed by links within a matching <a> tag.
 * @param {Element} container The container element
 */
export function wrapImgsInLinks(container) {
  const pictures = container.querySelectorAll('picture');
  pictures.forEach((pic) => {
    const link = pic.parentElement.querySelector('a');
    if (link && link.tagName === 'A' && link.href) {
      link.innerHTML = pic.outerHTML;
      pic.replaceWith(link);
    }
  });
}

/**
 * Wraps images with size attributes
 * @param {Element} container The container element
 */
function wrapImgsInSize(container) {
  const images = container.querySelectorAll('img');
  images.forEach((img) => {
    // Get the rendered size
    const { width, height } = img;
    img.setAttribute('width', width);
    img.setAttribute('height', height);
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main, fragment = false) {
  decorateIcons(main);
  decorateImages(main);
  if (!fragment) buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

// FOR DROPINS
// function preloadFile(href, as) {
//   const link = document.createElement('link');
//   link.rel = 'preload';
//   link.as = as;
//   link.crossOrigin = 'anonymous';
//   link.href = href;
//   document.head.appendChild(link);
// }

// EXTEND FOR OTHER PAGE TYPES
function getPageType() {
  const sku = getMetadata('sku');
  return sku ? 'pdp' : null;
}

async function setupPageType(main) {
  const type = getPageType();
  const configured = ['pdp'];
  if (type && configured.includes(type)) {
    const module = await import(`${window.hlx.codeBasePath}/scripts/pages/${type}/${type}.js`);
    if (module.default) module.default(main);
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  // const location = new URL(window.location.href);
  // if (location.pathname.startsWith('/us/p/')) {
  //   location.pathname = location.pathname.replace('/us/p/', '/');
  //   window.location.replace(location.href);
  // }

  // gtm set up
  // window.dataLayer = window.dataLayer || [];
  // window.dataLayer.push({
  //   'gtm.start': new Date().getTime(),
  //   event: 'gtm.js',
  // });

  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();

  const main = doc.querySelector('main');
  if (main) {
    await setupPageType(main);
    decorateMain(main);
    // add skip to main content link
    main.id = 'main';
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.classList.add('skip-link');
    skipLink.textContent = 'Skip to Content';
    doc.body.prepend(skipLink);
    doc.body.classList.add('appear');
    const sections = main.querySelectorAll('.section');
    let lcpCandidate;
    // eslint-disable-next-line no-restricted-syntax
    for (const section of sections) {
      lcpCandidate = section.querySelector('img');
      if (lcpCandidate) {
        // eslint-disable-next-line no-await-in-loop
        await loadSection(section, waitForFirstImage);
        break;
      } else loadSection(section);
    }
  }

  // events.emit('eds/lcp', true);
  sampleRUM.enhance();

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 1280 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  // await initializeDropins();

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadBreadcrumb(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));
  loadGeopopup(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
  swapIcons(main);

  const countries = await getCountries();
  sessionStorage.setItem('countries', JSON.stringify(countries));

  trackHistory();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

export async function fetchIndex(indexFile, pageSize = 500) {
  const handleIndex = async (offset) => {
    const resp = await fetch(`/${indexFile}.json?limit=${pageSize}&offset=${offset}`);
    const json = await resp.json();

    const newIndex = {
      complete: (json.limit + json.offset) === json.total,
      offset: json.offset + pageSize,
      promise: null,
      data: [...window.index[indexFile].data, ...json.data],
    };

    return newIndex;
  };

  window.index = window.index || {};
  window.index[indexFile] = window.index[indexFile] || {
    data: [],
    offset: 0,
    complete: false,
    promise: null,
  };

  // Return index if already loaded
  if (window.index[indexFile].complete) {
    return window.index[indexFile];
  }

  // Return promise if index is currently loading
  if (window.index[indexFile].promise) {
    return window.index[indexFile].promise;
  }

  window.index[indexFile].promise = handleIndex(window.index[indexFile].offset);
  const newIndex = await (window.index[indexFile].promise);
  window.index[indexFile] = newIndex;

  return newIndex;
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  // rerender dataLayer on session update
  wrapImgsInSize(document);
  loadDelayed();
  // addMagentoCacheListener(() => {
  //   try {
  //     pageTypePushGtm(pageType);
  //   } catch (error) {
  //   // eslint-disable-next-line no-console
  //     console.error('Error in pageTypePushGtm:', error);
  //   }
  // });
  // pageContextPush(pageType);
  // pageTypePushGtm(pageType);
}

loadPage();
