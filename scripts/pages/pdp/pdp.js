import { buildBlock, getMetadata } from '../../aem.js';

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
 * Extracts product variants.
 * @param {HTMLElement} main - <main> container.
 * @returns {Array<Object>} Array of product variants.
 */
function extractProductVariants(main) {
  return [...main.querySelectorAll('.product-variants > div')].map((row) => {
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
    return picture;
  }
  return null;
}

function buildPictures(data) {
  return data.map((d) => buildPicture(d)).filter((p) => p);
}

function getAttribute(name, arr) {
  return arr.find((a) => a.name === name);
}

function decorateForLCP(main, product) {
  const { attributes, images } = product;
  const { sku } = product;
  const designer = getAttribute('designer', attributes);
  const brand = getAttribute('brand', attributes);
  const relatives = getAttribute('relatives', attributes);

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
  if (sku && brand && brand.value && relatives && relatives.label && relatives.value) {
    const afterName = `<ul class="brand">
        <li>${brand.value}</li>
        <li><a href="#more-from-the-series">View the ${relatives.value} ${relatives.label}</a></li>
      </ul>
      <p class="price">&nbsp;</p>
      <p class="sku">${sku}`;
    h1.insertAdjacentHTML('afterend', afterName);
  }

  // build gallery (for lcp)
  const pictures = main.querySelectorAll('picture') || buildPictures(images);
  const gallerySection = document.createElement('div');
  gallerySection.className = 'section';
  const gallery = buildBlock('gallery', [pictures]);
  gallerySection.append(gallery);
  main.append(gallerySection);
}

export default function init(main) {
  // build everything for lcp
  const product = buildProduct(main);
  clearDOM(main);
  if (product) decorateForLCP(main, product);
}
