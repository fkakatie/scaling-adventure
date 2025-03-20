import { buildBlock, getMetadata, loadCSS } from '../../aem.js';
// eslint-disable-next-line import/no-cycle
import { decorateMain } from '../../scripts.js';

/**
 * Finds attribute by name in array of attributes.
 * @param {string} name - Attribute name
 * @param {Array<Object>} arr - Array of attribute objects
 * @returns {Object|undefined} Found attribute, or undefined
 */
function getAttribute(name, arr) {
  return arr.find((a) => a.name === name);
}

/**
 * Returns value from an attribute object, or `null` if not found.
 * @param {Object} attr - Attribute object.
 * @param {string} [prop='value'] - Property name.
 * @returns {*} Attribute's property value, or `null` if not found.
 */
function getProperty(attr, prop = 'value') {
  return (attr && attr[prop]) ? attr[prop] : null;
}

// EXTRACT FROM DOM

/**
 * Extracts the product name.
 * @param {HTMLElement} main - <main> container.
 * @returns {string|null} Product name, or `null` if not found.
 */
function extractProductName(main) {
  const h1 = main.querySelector('h1');
  return h1 ? h1.textContent : null;
}

/**
 * Extracts the products stock status.
 * @returns {boolean|string} Stock status, or `false` if not found.
 */
function extractProductStock() {
  return getMetadata('instock') || false;
}

/**
 * Extracts contents of nested `div`s.
 * @param {HTMLElement} main - <main> container.
 * @param {string} selector - CSS selector for identifying containing `div`.
 * @param {string[]} [keys=[]] - Array of keys to map extracted values to.
 * @returns {Array<Object>} Array of objects (with `keys` as named properties).
 */
function extractNestedContent(main, selector, keys = []) {
  return [...main.querySelectorAll(`${selector} > div`)].map((row) => {
    const values = [...row.querySelectorAll(':scope > div')].map((col) => col.textContent.trim());
    // map keys to extracted values
    const arr = keys.map((key, i) => {
      const value = values[i] || '';
      return [key, value]; // pair key with value
    });
    return Object.fromEntries(arr); // convert array to object
  });
}

/**
 * Extracts product attributes.
 * @param {HTMLElement} main - <main> container.
 * @returns {Array<Object>} Array of product attributes.
 */
function extractProductAttributes(main) {
  const attributes = extractNestedContent(main, '.product-attributes', ['name', 'label', 'value']);
  return attributes;
}

/**
 * Extracts product categories.
 * @param {HTMLElement} main - <main> container.
 * @returns {Array<Object>} Array of product categories.
 */
function extractProductCategories(main) {
  const categories = extractNestedContent(main, '.product-categories', ['level', 'urlkey', 'urlpath']);
  return categories;
}

/**
 * Extracts product options.
 * @param {HTMLElement} main - <main> container.
 * @returns {Array<Object>} Array of option groups (with `id`, `title`, `type`, and `values`).
 */
function extractProductOptions(main) {
  const options = [];
  main.querySelectorAll('.product-options > div').forEach((row) => {
    const cols = [...row.querySelectorAll(':scope > div')].map((col) => col.textContent.trim());
    if (cols[0] !== 'option') { // identify option group
      const [id, title, typename, type, multiple, required] = cols;
      options.push({
        id, title, typename, type: type || 'dropdown', multiple, required, values: [],
      });
    } else if (options.length > 0) { // extract option group values
      const [, id, title, value, selected, inStock] = cols;
      options[options.length - 1].values.push({
        id, title, value, selected, inStock,
      });
    }
  });
  return options;
}

/**
 * Extracts floating-point number.
 * @param {string} text - Text to parse.
 * @returns {number|null} Float, or `null` if not found.
 */
function extractFloat(text) {
  const match = text.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

/**
 * Extracts image data from `picture` elements.
 * @param {HTMLElement} container - Container element.
 * @returns {Array<Object>} Array of image data (with `sources` and `img` data).
 */
function extractImageData(container) {
  return [...container.querySelectorAll('picture')].map((picture) => {
    const sources = [...picture.querySelectorAll('source')].map((source) => ({
      type: source.getAttribute('type'),
      srcset: source.getAttribute('srcset'),
      media: source.getAttribute('media') || '',
    }));
    // valid images must have source(s) and img
    const img = picture.querySelector('img');
    return img
      ? {
        sources,
        img: {
          src: img.getAttribute('src') || '',
          alt: img.getAttribute('alt') || '',
          width: img.getAttribute('width') || '',
          height: img.getAttribute('height') || '',
          loading: img.getAttribute('loading') || 'lazy',
        },
      }
      : null;
  }).filter((i) => i);
}

/**
 * Extracts product images.
 * @param {HTMLElement} main - <main> container.
 * @returns {Array<Object>} Array of image objects (with `sources` and `img`).
 */
function extractProductImages(main) {
  return [...main.querySelectorAll('.product-images > div')].reduce(
    (acc, row) => acc.concat(extractImageData(row)),
    [],
  );
}

/**
 * Extracts product variant attributes.
 * @param {HTMLElement} main - <main> container.
 * @param {Array<Object>} variants - Array of product variants.
 * @returns {void} Hydrated variants.
 */
function extractVariantAttributes(main, variants) {
  const productVariants = variants;
  let currentVariant = null;
  // hydrate variants with attributes
  main.querySelectorAll('.variant-attributes > div').forEach((row) => {
    const cols = [...row.querySelectorAll(':scope > div')].map((col) => col.textContent.trim());
    if (cols[0] === 'sku') { // identify variant
      const sku = cols[1] || '';
      currentVariant = productVariants.find((variant) => variant.sku === sku);
      if (currentVariant && !currentVariant.attributes) {
        currentVariant.attributes = [];
      }
    } else if (currentVariant && cols[0] === 'attribute') { // add attribute(s) to variant
      const [, name, label, value] = cols;
      currentVariant.attributes.push({ name, label, value });
    }
  });
  return productVariants;
}

/**
 * Extracts product variants.
 * @param {HTMLElement} main - <main> container.
 * @returns {Array<Object>} Array of product variants.
 */
function extractProductVariants(main) {
  const variants = [...main.querySelectorAll('.product-variants > div')].map((row) => {
    const cols = [...row.querySelectorAll(':scope > div')];
    const [
      sku,
      name,
      description,
      stockStatus,
      regularPrice,
      finalPrice,, // handle images seperately
      selections,
    ] = cols.map((col) => (col ? col.textContent.trim() : ''));
    const images = cols[6] || null;
    return {
      sku,
      name,
      description,
      stockStatus,
      regularPrice: regularPrice ? extractFloat(regularPrice) : '',
      finalPrice: finalPrice ? extractFloat(finalPrice) : '',
      currency: finalPrice ? finalPrice.match(/[A-Za-z]{3}$/)[0] : 'USD',
      images: images ? extractImageData(images) : [],
      selections: selections ? selections.split(',').map((s) => s.trim()) : [],
    };
  });
  const hydratedVariants = extractVariantAttributes(main, variants);
  return hydratedVariants;
}

/**
 * Extract height value from attributes.
 * @param {string} prop - Property name.
 * @param {Array<Object>} attributes - Array of attribute objects.
 * @returns {number|null} Parsed height value, or `null` if invalid.
 */
function getHeight(prop, attributes) {
  const height = getProperty(getAttribute(prop, attributes));
  return height !== undefined ? parseFloat(height) : null; // account for 0 height
}

/**
 * Builds height option filter for rod-mounted products.
 * @param {Object} variant - Product variant object.
 * @returns {Object|null} Height filter configuration object, or `null` if not applicable.
 */
function buildHeightOption(variant) {
  const { attributes } = variant;
  if (attributes) {
    const mounting = getAttribute('mounting', attributes);
    if (mounting && mounting.value === 'Rod') {
      const rodQty = getProperty(getAttribute('rodqty', attributes));
      const minHeight = getHeight('minheight', attributes);
      const oaHeight = getHeight('oaheight', attributes);
      if (rodQty && minHeight && oaHeight) {
        // max height is always 36 inches more than oaHeight
        const maxHeight = oaHeight + 36;
        const heightFilter = {
          id: 'height_filter',
          multiple: '',
          required: '',
          title: 'Height',
          type: 'dropdown',
          typename: 'ProductViewOptionValueConfiguration',
          values: [],
        };
        // start with standard height option (no additional cost)
        const heightOptions = [{
          height: oaHeight,
          price: 0,
          title: 'Standard',
        }];
        // generate height options from minHeight to maxHeight
        for (let h = minHeight; h <= maxHeight; h += 1) {
          let price = 200 * rodQty; // $200 per rod
          // if height exceeds oaHeight by 24", increase price
          if (h - oaHeight >= 24) price = 300 * rodQty;
          // skip heights that would round to oaHeight
          if (Math.floor(h) !== Math.floor(oaHeight)) {
            heightOptions.push({
              height: Math.floor(h) === maxHeight ? maxHeight : h,
              price,
            });
          }
        }
        // sort heights in descending order and add to filter
        heightOptions.sort((a, b) => b.height - a.height)
          .forEach((option) => {
            const { height, price, title } = option;
            heightFilter.values.push({
              id: btoa(JSON.stringify({ value: height, price })), // base64 encode height, price
              inStock: 'inStock',
              selected: '',
              title: `${title || 'Height'} ${height}" +$${price}`,
              value: price.toString(),
            });
          });
        return heightFilter;
      }
    }
  }
  return null;
}

function buildProduct(main) {
  const sku = getMetadata('sku').trim().toUpperCase();
  if (!sku || window.product) return {};

  // init product from page
  window.product = {
    sku,
    name: extractProductName(main),
    inStock: extractProductStock(),
    attributes: extractProductAttributes(main),
    categories: extractProductCategories(main),
    options: extractProductOptions(main),
    variants: extractProductVariants(main),
    images: extractProductImages(main),
    selectedVariant: null,
    externalId: getMetadata('externalid'),
  };

  const heightOption = buildHeightOption(window.product.variants[0], window.product.options);
  if (heightOption) window.product.options.push(heightOption);

  return window.product;
}

/**
 * Cleans up DOM in preparation for LCP.
 * @param {HTMLElement} main - <main> container.
 */
function clearDOM(main) {
  const configuredClasses = [
    'product-attributes',
    'product-categories',
    'product-options',
    'product-variants',
    'variant-attributes',
  ];
  [...main.children].forEach((child) => {
    [...child.children].forEach((c) => {
      const match = configuredClasses.some((section) => c.classList.contains(section));
      if (match) c.remove(); // remove non-lcp data we have stored in product
      else if (c.classList.contains('product-images')) {
        // unnest picture or remove empty section
        const picture = c.querySelector('picture');
        if (picture) c.replaceWith(picture);
        else c.remove();
      }
    });
  });
}

/**
 * Builds picture from image data.
 * @param {Object} data - Image data object
 * @param {Array<Object>} data.sources - Array of source objects
 * @param {Object} data.img - Image attributes object
 * @returns {HTMLPictureElement|null} Picture element, or `null` if invalid
 */
function buildPicture(data) {
  const { sources, img } = data;
  if (sources && img) {
    const picture = document.createElement('picture');
    // rebuild sources
    sources.forEach((s) => {
      const source = document.createElement('source');
      Object.entries(s).forEach(([key, value]) => {
        source.setAttribute(key, value);
      });
      picture.append(source);
    });
    // rebuild image
    const image = document.createElement('img');
    Object.entries(img).forEach(([key, value]) => {
      image.setAttribute(key, value);
    });
    picture.append(image);
    return picture;
  }
  return null;
}

/**
 * Builds multiple picture elements from array of image data.
 * @param {Array<Object>} data - Array of image data objects
 * @returns {Array<HTMLPictureElement>} Array of picture elements
 */
function buildPictures(data) {
  return data.map((d) => buildPicture(d)).filter((p) => p);
}

/**
 * Gets variant property value from first variant.
 * @param {string} name - Property name to get
 * @param {Array<Object>} variants - Array of variant objects
 * @returns {*|null} Property value, or `null` if not found
 */
function getVariant(name, variants) {
  if (!variants || !variants.length) return null;
  const variant = variants[0];
  return variant ? variant[name] : '';
}

/**
 * Gets currency symbol for given currency code.
 * @param {string} currency - Currency code (e.g. 'USD')
 * @returns {string} Currency symbol or empty string
 */
function getPriceSymbol(currency) {
  if (!currency) return '';
  return currency === 'USD' ? '$' : '€';
}

/**
 * Formats price with 2 decimal places.
 * @param {number|string} price - Price to format
 * @returns {string} Formatted price
 */
function formatPrice(price) {
  return typeof price === 'number'
    ? price.toLocaleString('en-US', { minimumFractionDigits: 2 })
    : price;
}

function writePrice(price, currency) {
  const priceEl = document.createElement('p');
  priceEl.className = 'price';
  const currencySymbol = document.createElement('span');
  currencySymbol.textContent = currency;
  const priceAmount = document.createElement('span');
  priceAmount.textContent = price ? formatPrice(price) : ' ';
  priceEl.append(currencySymbol, priceAmount);
  return priceEl;
}

function decorateForLCP(main, product) {
  const {
    attributes,
    images,
    sku,
    variants,
  } = product;
  const designer = getAttribute('designer', attributes);
  const brand = getAttribute('brand', attributes);
  const relatives = getAttribute('relatives', attributes);
  const currency = getPriceSymbol(getVariant('currency', variants));
  const price = getVariant('finalPrice', variants);

  // find (or build) product info
  let info;
  let h1 = main.querySelector('h1');
  if (h1) info = h1.closest('div');
  else {
    info = document.createElement('div');
    info.className = 'section';
    main.append(info);
  }

  // if no h1 in document, build one
  if (!h1 && product.name) {
    h1 = document.createElement('h1');
    h1.textContent = product.name;
    info.append(h1);
  }

  // add designer information
  if (designer && designer.label && designer.value) {
    const beforeName = `<p class="designer">${designer.label}: ${designer.value}</p>`;
    h1.insertAdjacentHTML('beforebegin', beforeName);
  }

  // add additional product info (brand, price, sku) after h1
  const afterEls = [];

  // branding
  const ul = document.createElement('ul');
  ul.className = 'brand';
  const brandEl = document.createElement('li');
  brandEl.textContent = brand ? brand.value : ' ';
  ul.append(brandEl);
  const relativesEl = document.createElement('li');
  const a = document.createElement('a');
  a.href = '#more-from-the-series';
  const hasRelatives = relatives && relatives.value && relatives.label;
  a.textContent = hasRelatives ? `View the ${relatives.value} ${relatives.label}` : ' ';
  relativesEl.append(a);
  ul.append(relativesEl);
  afterEls.push(ul);

  // price
  const priceEl = writePrice(price, currency);
  afterEls.push(priceEl);

  // sku
  const skuEl = document.createElement('p');
  skuEl.className = 'sku';
  skuEl.textContent = sku || ' ';
  afterEls.push(skuEl);

  info.append(...afterEls);

  // build gallery (for lcp)
  const pictures = main.querySelectorAll('picture') || buildPictures(images);
  const gallerySection = document.createElement('div');
  gallerySection.className = 'section';
  const gallery = buildBlock('gallery', [pictures]);
  gallerySection.append(gallery);
  main.append(gallerySection);
}

export default async function initPDP(main) {
  // build everything for lcp
  const product = buildProduct(main);
  clearDOM(main);
  if (product) decorateForLCP(main, product);
  await loadCSS(`${window.hlx.codeBasePath}/scripts/pages/pdp/pdp.css`);
}

function wrapEls(els) {
  const wrapper = document.createElement('div');
  const section = document.createElement('div');
  wrapper.append(...els);
  section.append(wrapper);
  decorateMain(section, true);
  [...wrapper.attributes].forEach((a) => {
    wrapper.removeAttribute(a.name);
  });
  return wrapper;
}

/**
 * Creates section element.
 * @returns {HTMLElement} Section element
 */
function buildSection() {
  const section = document.createElement('div');
  section.className = 'section';
  return section;
}

/**
 * Extracts specifications from product variant attributes.
 * @param {Object} product - Product object
 * @returns {Array<string>} Array of specification strings
 */
function extractSpecs(product) {
  if (product && product.variants) {
    const variant = product.variants[0];
    if (variant && variant.attributes) {
      const { attributes } = variant;
      const specs = attributes
        .filter((a) => a.name.startsWith('specification'))
        .sort((a, b) => {
          const numA = parseInt(a.name.split('_').pop(), 10);
          const numB = parseInt(b.name.split('_').pop(), 10);
          return numA - numB;
        })
        .map((s) => s.value.trim());
      return specs;
    } return [];
  } return [];
}

/**
 * Builds array of specification elements.
 * @param {Object} product - Product object
 * @returns {Array<string>} Array of specification elements
 */
function buildSpecsElems(product) {
  const specs = extractSpecs(product);
  const elems = [];
  if (specs.length > 0) elems.push(...specs);
  return elems;
}

function buildSpecs(main, product) {
  const elems = buildSpecsElems(product);
  const section = buildSection();
  section.append(buildBlock('specs', [elems]));
  main.append(section);
}

/**
 * Extracts options from product data.
 * @param {Object} product - Product object
 * @returns {Object} Object containing variants and options arrays
 */
function extractOptions(product) {
  if (product) {
    const opts = { variants: [], options: [] };
    const { variants, options } = product;
    if (variants) {
      variants.forEach((v) => {
        const { name, images } = v;
        opts.variants.push({ name, images });
      });
    }
    if (options) opts.options.push(...options);
    return opts;
  }
  return {};
}

function buildOptionsForm(main, product) {
  const { variants, options } = extractOptions(product);
  const elems = [];
  if (variants) {
    const imgOptions = document.createElement('ul');
    variants.forEach((v) => {
      const picture = buildPicture(v.images[0]);
      if (picture && picture.querySelector('img')) {
        picture.querySelector('img').setAttribute('alt', v.name);
        const li = document.createElement('li');
        li.append(picture);
        imgOptions.append(li);
      }
    });
    elems.push(['Option:', imgOptions]);
  }
  if (options) {
    options.forEach((o) => {
      const ul = document.createElement('ul');
      o.values.forEach((v) => {
        const li = document.createElement('li');
        li.textContent = v.title;
        ul.append(li);
      });
      elems.push([o.title, ul]);
    });
  }
  // build extras (bulbs) checkbox; need bulb_qty and bulb_sku
  // build price
  const currency = getPriceSymbol(getVariant('currency', product.variants));
  const price = getVariant('finalPrice', product.variants);
  const priceEl = writePrice(price, currency);
  elems.push(['Price:', priceEl]);

  const section = buildSection();
  section.append(buildBlock('options-form', elems));
  main.append(section);
}

function buildSocialFeed(main, product) {
  let streamId = product ? product.sku : '';
  if (product && product.productAttributes && product.productAttributes.olapic_id) {
    streamId = product.productAttributes.olapic_id.value;
  }
  const section = buildSection();
  const block = buildBlock('social-feed', [
    ['tag', 'visualcomfort'],
    ['count', '6'],
    ['order', 'shuffled'],
    ['stream', streamId],
  ]);
  section.append(block);
  main.append(section);
}

function buildHeading(tag, text) {
  const heading = document.createElement(tag);
  heading.textContent = text;
  return heading;
}

/**
 * Builds description section from variant.
 * @param {Object} variant - Product variant object
 * @returns {HTMLElement} Description section
 */
function buildDescription(variant) {
  const heading = buildHeading('h3', 'Description');
  const description = document.createElement('p');
  description.textContent = variant.description;
  return wrapEls([heading, description]);
}

/**
 * Builds additional information section.
 * @param {Object} product - Product object
 * @returns {HTMLElement} Additional info section
 */
function buildAdditionalInfo(product) {
  const heading = buildHeading('h3', 'Additional Product Information');
  const specs = buildSpecsElems(product);
  const specsBlock = buildBlock('specs', [specs]);
  specsBlock.classList.add('table');
  return wrapEls([heading, specsBlock]);
}

/**
 * Builds technical resources section.
 * @param {Array<Object>} attributes - Array of attribute objects
 * @returns {HTMLElement|string} Technical resources section, or empty string
 */
function buildTechResources(attributes) {
  const techAttrs = attributes.find((a) => a.name === 'technical_resources');
  if (techAttrs && techAttrs.label && techAttrs.value) {
    const values = techAttrs.value.split(',');
    const heading = buildHeading('h3', techAttrs.label);
    const elems = [];
    values.forEach((v) => {
      const a = document.createElement('a');
      a.href = v;
      const phTitle = v.split('/')[0];
      a.textContent = phTitle;
      elems.push(a);
    });
    const resourcesBlock = buildBlock('grid', [elems]);
    resourcesBlock.classList.add('technical-resources');
    return wrapEls([heading, resourcesBlock]);
  }
  return '';
}

/**
 * Builds rating section placeholder.
 * @returns {HTMLElement} Rating section
 */
function buildRating() {
  const heading = buildHeading('h3', 'Rating');
  const block = buildBlock('grid', []);
  return wrapEls([heading, block]);
}

// function buildCAProp() {

// }

function buildAccordionSection(title, fullTitle) {
  const accordionSection = buildSection();
  const accordionConfig = buildBlock('section-metadata', [
    ['accordion', title],
    ['full accordion', fullTitle],
  ]);
  accordionSection.append(accordionConfig);
  return accordionSection;
}

function buildSpecificationsTab(product, variant, attributes) {
  // setup tab section
  const specSection = buildAccordionSection('Specifications', 'Specification | Downloads');
  // build subheadings
  const description = buildDescription(variant);
  if (description) specSection.append(description);
  const additionalInfo = buildAdditionalInfo(product);
  if (additionalInfo) specSection.append(additionalInfo);
  const rating = buildRating();
  if (rating) specSection.append(rating);
  const techResources = buildTechResources(attributes);
  if (techResources) specSection.append(techResources);
  // const caProp = buildCAProp();
  // if (caProp) specSection.append(caProp);

  return specSection;
}

export function buildInfoAccordion(main, product) {
  if (product && product.variants) {
    const variant = product.variants[0];
    const { attributes } = variant;
    if (attributes) {
      // specifications
      const specsTab = buildSpecificationsTab(product, variant, attributes);
      // paper template
      // more from series
      const seriesTab = buildAccordionSection('More from the Series', 'More from the Series');
      // tips
      const tipsTab = buildAccordionSection('Tips', 'Tips');
      main.append(specsTab, seriesTab, tipsTab);
    }
  }
}

export function populatePDP(main, product) {
  buildSpecs(main, product);
  buildOptionsForm(main, product);
  buildSocialFeed(main, product);
  buildInfoAccordion(main, product);
}

// export function hydratePDP(main, product) {
//   // console.log('howdy from hydratePDP');
// }
