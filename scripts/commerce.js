/* eslint-disable import/prefer-default-export, import/no-cycle */
import { getConfigValue } from './configs.js';
import { getConsent } from './scripts.js';
import { getCompanyType } from './user-context.js';

/* Common query fragments */
export const priceFieldsFragment = `fragment priceFields on ProductViewPrice {
  roles
  regular {
      amount {
          currency
          value
      }
  }
  final {
      amount {
          currency
          value
      }
  }
}`;

/* Queries PDP */
export const refineProductQuery = `query RefineProductQuery($sku: String!, $optionIds: [String!]!) {
  refineProduct(
    sku: $sku,
    optionIds: $optionIds
  ) {
    images(roles: []) {
      url
      roles
      label
    }
    ... on SimpleProductView {
      price {
        ...priceFields
      }
    }
    addToCartAllowed
  }
}
${priceFieldsFragment}`;

export const productDetailQuery = `query ProductQuery($sku: String!) {
  products(skus: [$sku]) {
    __typename
    externalId
    sku
    name
    description
    shortDescription
    urlKey
    inStock
    metaTitle
    metaKeyword
    metaDescription
    images(roles: []) {
      url
      label
      roles
    }
    attributes(roles: []) {
      name
      label
      value
      roles
    }
    ... on SimpleProductView {
      price {
        ...priceFields
      }
    }
    ... on ComplexProductView {
      options {
        id
        title
        required
        values {
          id
          title
          inStock
          ...on ProductViewOptionValueSwatch {
            type
            value
          }
        }
      }
      priceRange {
        maximum {
          ...priceFields
        }
        minimum {
          ...priceFields
        }
      }
    }
  }
  variants(sku: $sku) {
    variants {
    selections
      product {
        __typename
        sku
        name
        urlKey
        inStock
        images(roles: "thumbnail") {
          url
          label
          roles
        }
      }
    }
    cursor
  }
}
${priceFieldsFragment}`;

const variantsQuery = `query($sku: String!, $optionIds: [String!], $pageSize: Int, $cursor: String) {
  variants(sku: $sku, optionIds: $optionIds, pageSize: $pageSize, cursor: $cursor) {
    variants {
    selections
      product {
        __typename
        sku
        name
        urlKey
        inStock
        images(roles: "thumbnail") {
          url
          label
          roles
        }

      }
    }
    cursor
  }
}
`;

const relatedProductsQuery = `query Products($series: String!) {
  products(filter: { relatives: { match: $series } }, pageSize: 6) {
      items {
          sku
          designer
          name
          price {
              regularPrice {
                  amount {
                      currency
                      value
                  }
              }
          }
          image {
              url
          }
          url_key
      }
  }
}`;

const accessoriesProductsQuery = `query ProductsBySkus($skus: [String!]!) {
  products(filter: { sku: { in: $skus } }) {
    items {
      sku
      name
      price {
        regularPrice {
          amount {
            currency
            value
          }
        }
      }
      image {
        url
      }
      url_key
    }
  }
}`;


/* Common functionality */

export async function performCatalogServiceQuery(query, variables) {
  const headers = {
    'Content-Type': 'application/json',
    'Magento-Environment-Id': await getConfigValue('commerce-environment-id'),
    'Magento-Website-Code': await getConfigValue('commerce-website-code'),
    'Magento-Store-View-Code': await getConfigValue('commerce-store-view-code'),
    'Magento-Store-Code': await getConfigValue('commerce-store-code'),
    'Magento-Customer-Group': await getConfigValue('commerce-customer-group'),
    'x-api-key': await getConfigValue('commerce-x-api-key'),
  };

  const apiCall = new URL(await getConfigValue('commerce-endpoint'));
  apiCall.searchParams.append('query', query.replace(/(?:\r\n|\r|\n|\t|[\s]{4})/g, ' ')
    .replace(/\s\s+/g, ' '));
  apiCall.searchParams.append('variables', variables ? JSON.stringify(variables) : null);

  const response = await fetch(apiCall, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    return null;
  }

  const queryResponse = await response.json();

  return queryResponse.data;
}

export function getSignInToken() {
  // TODO: Implement in project
  return '';
}

export async function performMonolithGraphQLQuery(query, variables, GET = true, USE_TOKEN = false) {
  const GRAPHQL_ENDPOINT = await getConfigValue('commerce-core-endpoint');

  const headers = {
    'Content-Type': 'application/json',
    Store: await getConfigValue('commerce-store-view-code'),
  };

  if (USE_TOKEN) {
    if (typeof USE_TOKEN === 'string') {
      headers.Authorization = `Bearer ${USE_TOKEN}`;
    } else {
      const token = getSignInToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
  }

  let response;
  if (!GET) {
    response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: query.replace(/(?:\r\n|\r|\n|\t|[\s]{4})/g, ' ').replace(/\s\s+/g, ' '),
        variables,
      }),
    });
  } else {
    const endpoint = new URL(GRAPHQL_ENDPOINT);
    endpoint.searchParams.set('query', query.replace(/(?:\r\n|\r|\n|\t|[\s]{4})/g, ' ').replace(/\s\s+/g, ' '));
    endpoint.searchParams.set('variables', JSON.stringify(variables));
    response = await fetch(
      endpoint.toString(),
      { headers },
    );
  }

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export function renderPrice(product, format, html = (strings, ...values) => strings.reduce((result, string, i) => result + string + (values[i] || ''), ''), Fragment = null, customerGroupPrices = null) {
  const companyType = getCompanyType();
  if (product.price) {
    const { regular, final } = product.price;
    if (companyType === 'wholesale') {
      if (final.amount.value === 0 || regular.amount.value === 0) {
        return;
      }
      if (product.variants) {
        const variantWholesalePrices = product.variants.map(variant => {
          return variant.price.final.amount.value;
        });
        const variantFilteredPrices = variantWholesalePrices.filter(price => price !== 0);

        const minPriceWholesale = Math.min(...variantFilteredPrices);
        const maxPriceWholesale = Math.max(...variantFilteredPrices);
        if (minPriceWholesale !== maxPriceWholesale) {
          return html`<${Fragment}>
            <span class="price-range">${format(minPriceWholesale)} - ${format(maxPriceWholesale)}</span>
          </${Fragment}>`;
        }
        if (regular.amount.value === final.amount.value) {
          return html`<span class="price-final">${format(final.amount.value)}</span>`;
        }
      } else {
        // Simple product
        if (final.amount.value === 0 || regular.amount.value === 0) {
          return;
        }
        if (regular.amount.value === final.amount.value) {
          return html`<span class="price-final">${format(final.amount.value)}</span>`;
        }
      }
    }
    if (companyType === 'trade') {
      if (product.tradeprice) {
        if (product.variants) {
          const variantTradePrices = product.variants.map(variant => {
            if (variant.tradeprice) {
              return variant.tradeprice.final.amount.value;
            } else {
              return 0;
            }
          });
          const variantFilteredPrices = variantTradePrices.filter(price => price !== 0);
          // Calculate minimum and maximum trade prices from the array
          const minPriceTrade = Math.min(...variantFilteredPrices);
          const maxPriceTrade = Math.max(...variantFilteredPrices);
          if (variantFilteredPrices.length > 0 && minPriceTrade !== maxPriceTrade) {
            if (product.priceRange) {
              const [minPrice, maxPrice] = product.priceRange;
              return html`
              <${Fragment}>
              <span class="price-range-sale">
                  <span class="price-regular">${format(minPrice)} - ${format(maxPrice)}</span>
                  <span class="price-range">
                      <span class="sale-label">TRADE </span>
                      ${format(minPriceTrade)} - ${format(maxPriceTrade)}
                  </span>
              </span>
              </${Fragment}>
              `;
            }
          } else {
            return html`<${Fragment}>
            <span class="price-regular">${format(final.amount.value)}</span> <span class="price-final"><span class="sale-label">TRADE</span> ${format(product.tradeprice.final.amount.value)}</span>
            </${Fragment}>`
          }
        } else {
          return html`<${Fragment}>
          <span class="price-regular">${format(final.amount.value)}</span> <span class="price-final"><span class="sale-label">TRADE</span> ${format(product.tradeprice.final.amount.value)}</span>
        </${Fragment}>`
        }
      }
    }
  }
  if (companyType === 'retail' || companyType === 'guest') {
    if (product.variants) {
      if (product.variants.length === 1) {
        if (product.variants[0].price.final.amount.value !== product.variants[0].price.regular.amount.value) {
          return html`<${Fragment}>
          <span class="price-regular">${format(product.variants[0].price.regular.amount.value)}</span> <span class="price-final"><span class="sale-label">SALE</span> ${format(product.variants[0].price.final.amount.value)}</span>
        </${Fragment}>`;
        } else {
          return html`<${Fragment}>
          <span class="price-final">${format(product.variants[0].price.final.amount.value)}</span>
          </${Fragment}>`;
        }
      }
    }
    if (product.priceRange && product.salePriceRange && product.price) {
      const [minPrice, maxPrice] = product.priceRange;
      const [minPriceSale, maxPriceSale] = product.salePriceRange;
      const { regular, final } = product.price;
      // Check if all variants have the same final price
      const allVariantsSamePrice = product.variants.every(variant => {
        return variant.price.final.amount.value === product.variants[0].price.final.amount.value;
      });
      if (minPriceSale === maxPriceSale) {
        if (minPrice === maxPrice) {
          if (final.amount.value === 0 || regular.amount.value === 0) {
            return;
          }
          if (regular.amount.value === final.amount.value) {
            return html`<span class="price-final">${format(final.amount.value)}</span>`;
          }
          return html`<${Fragment}>
            <span class="price-regular">${format(regular.amount.value)}</span> <span class="price-final"><span class="sale-label">SALE</span> ${format(final.amount.value)}</span>
          </${Fragment}>`;
        } else if (minPriceSale < minPrice) {
          if (final.amount.value === 0 || regular.amount.value === 0) {
            return;
          }
          return html`<${Fragment}>
            <span class="price-range-sale">
              <span class="price-regular">${format(minPrice)} - ${format(maxPrice)}</span>
              <span class="price-range">
                <span class="sale-label">SALE </span>
                ${format(minPriceSale)}
              </span>
            </span>
          </${Fragment}>`;
        } else if (minPrice < maxPrice) {
          if (allVariantsSamePrice) {
            return html`<${Fragment}>
              <span class="price-final">${format(product.variants[0].price.final.amount.value)}</span>
            </${Fragment}>`;
          } else {
            return html`<${Fragment}>
              <span class="price-range">${format(minPrice)} - ${format(maxPrice)}</span>
            </${Fragment}>`;
          }
        } else {
          if (product.variants.length === 1) {
            return html`<${Fragment}>
              <span class="price-final">${format(product.variants[0].price.final.amount.value)}</span>
            </${Fragment}>`;
          } else {
            if (allVariantsSamePrice) {
              return html`<${Fragment}>
                <span class="price-final">${format(product.variants[0].price.final.amount.value)}</span>
              </${Fragment}>`;
            } else {
              return html`<${Fragment}>
                <span class="price-range">${format(minPrice)} - ${format(maxPrice)}</span>
              </${Fragment}>`;
            }
          }
        }
      } else {
        if (allVariantsSamePrice) {
          return html`<${Fragment}>
            <span class="price-final">${format(product.variants[0].price.final.amount.value)}</span>
          </${Fragment}>`;
        }
        return html`<${Fragment}>
          <span class="price-range-sale">
            <span class="price-regular">${format(minPrice)} - ${format(maxPrice)}</span>
            <span class="price-range">
              <span class="sale-label">SALE </span>
              ${format(minPriceSale)} - ${format(maxPriceSale)}
            </span>
          </span>
        </${Fragment}>`;
      }
    }
  }

  // Simple product
  if (product.price) {
    const { regular, final } = product.price;
    if (final.amount.value === 0 || regular.amount.value === 0) {
      return;
    }
    if (product.tradeprice) {
      return html`<${Fragment}>
        <span class="price-regular">${format(final.amount.value)}</span> <span class="price-final"><span class="sale-label">TRADE</span> ${format(product.tradeprice.final.amount.value)}</span>
      </${Fragment}>`
    }
    if (regular.amount.value === final.amount.value) {
      return html`<span class="price-final">${format(final.amount.value)}</span>`;
    }
    return html`<${Fragment}>
      <span class="price-regular">${format(regular.amount.value)}</span> <span class="price-final"><span class="sale-label">SALE</span> ${format(final.amount.value)}</span>
    </${Fragment}>`;
  }

  if (product.priceRange) {
    const [regular, final] = product.priceRange;
    if (final === 0 || final === 0) {
      return;
    }
    if (regular === final) {
      return html`<${Fragment}>
      <span class="price-final">${format(final)}</span>
      </${Fragment}>`;
    } else {
      return html`<${Fragment}>
        <span class="price-range">${format(regular)} - ${format(final)}</span>
      </${Fragment}>`;
    }
  }

  // Complex product
  if (product.priceRange) {
    const { regular: regularMin, final: finalMin } = product.priceRange.minimum;
    const { final: finalMax } = product.priceRange.maximum;
    if (finalMin.amount.value === 0 || finalMax.amount.value === 0) {
      return;
    }

    if (finalMin.amount.value !== finalMax.amount.value) {
      return html`
      <div class="price-range">
        ${finalMin.amount.value !== regularMin.amount.value ? html`<span class="price-regular">${format(regularMin.amount.value)}</span>` : ''}
        <span class="price-from">${format(finalMin.amount.value)} - ${format(finalMax.amount.value)}</span>
      </div>`;
    }

    if (finalMin.amount.value !== regularMin.amount.value) {
      return html`<${Fragment}>
      <span class="price-final">${format(finalMin.amount.value)} - ${format(regularMin.amount.value)}</span>
    </${Fragment}>`;
    }

    return html`<span class="price-final">${format(finalMin.amount.value)}</span>`;
  }

  return null;
}

/* PDP specific functionality */

export function getSkuFromUrl() {
  const path = window.location.pathname;
  const result = path.match(/\/products\/[\w|-]+\/([\w|-]+)$/);
  // return result?.[1];
  // TODO Remove | For testing purposes
  return 'TOB5090';
  return 'KW5531';
  return 'TOB5115';
  return 'CHO2152'; // Social native gallery has only two images
}

const productsCache = {};
export async function getProduct(sku) {
  // eslint-disable-next-line no-param-reassign
  sku = sku.toUpperCase();
  if (productsCache[sku]) {
    return productsCache[sku];
  }
  const rawProductPromise = performCatalogServiceQuery(productDetailQuery, { sku });
  const productPromise = rawProductPromise.then((productData) => {
    if (!productData?.products?.[0]) {
      return null;
    }

    // TODO: Remove if not needed and separate query for variants is used
    // Alternatively return with variants data
    productData.products[0].variants = productData.variants.variants;
    console.log('prod', productData.products[0]);

    return productData?.products?.[0];
  });

  productsCache[sku] = productPromise;
  return productPromise;
}

export async function trackHistory() {
  if (!getConsent('commerce-recommendations')) {
    return;
  }
  // Store product view history in session storage
  const storeViewCode = await getConfigValue('commerce-store-view-code');
  window.adobeDataLayer?.push((dl) => {
    dl.addEventListener('adobeDataLayer:change', (event) => {
      const key = `${storeViewCode}:productViewHistory`;
      let viewHistory = JSON.parse(window.localStorage.getItem(key) || '[]');
      viewHistory = viewHistory.filter((item) => item.sku !== event.productContext.sku);
      viewHistory.push({ date: new Date().toISOString(), sku: event.productContext.sku });
      window.localStorage.setItem(key, JSON.stringify(viewHistory.slice(-10)));
    }, { path: 'productContext' });
    dl.addEventListener('place-order', () => {
      const shoppingCartContext = dl.getState('shoppingCartContext');
      if (!shoppingCartContext) {
        return;
      }
      const key = `${storeViewCode}:purchaseHistory`;
      const purchasedProducts = shoppingCartContext.items.map((item) => item.product.sku);
      const purchaseHistory = JSON.parse(window.localStorage.getItem(key) || '[]');
      purchaseHistory.push({ date: new Date().toISOString(), items: purchasedProducts });
      window.localStorage.setItem(key, JSON.stringify(purchaseHistory.slice(-5)));
    });
  });
}

export function setJsonLd(data, name) {
  const existingScript = document.head.querySelector(`script[data-name="${name}"]`);
  if (existingScript) {
    existingScript.innerHTML = JSON.stringify(data);
    return;
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';

  script.innerHTML = JSON.stringify(data);
  script.dataset.name = name;
  document.head.appendChild(script);
}

export async function loadErrorPage(code = 404) {
  const htmlText = await fetch(`/${code}.html`).then((response) => {
    if (response.ok) {
      return response.text();
    }
    throw new Error(`Error getting ${code} page`);
  });
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  document.body.innerHTML = doc.body.innerHTML;
  document.head.innerHTML = doc.head.innerHTML;

  // When moving script tags via innerHTML, they are not executed. They need to be re-created.
  const notImportMap = (c) => c.textContent && c.type !== 'importmap';
  Array.from(document.head.querySelectorAll('script'))
    .filter(notImportMap)
    .forEach((c) => c.remove());
  Array.from(doc.head.querySelectorAll('script'))
    .filter(notImportMap)
    .forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(({ name, value }) => {
        newScript.setAttribute(name, value);
      });
      const scriptText = document.createTextNode(oldScript.innerHTML);
      newScript.appendChild(scriptText);
      document.head.appendChild(newScript);
    });
}
export async function getCategoryNameFromUrlKey() {
  const { data: possibleProducts } = await performMonolithGraphQLQuery(
    productBreadcrumbQuery,
    { urlKey: getUrlKeyFromUrl() },
  );
  const product = possibleProducts?.products?.items?.[0];

  if (!product) {
    return null;
  }

  const clearanceFilter = document.referrer.toLowerCase().includes('clearance')
    ? (category) => category.name.toLowerCase().includes('clearance')
    : (category) => !category.name.toLowerCase().includes('clearance');

  // find the category that matches a PLP
  const plpIndex = (await fetchIndex('query-index')).data;

  const possiblePLPs = product.categories?.filter(
    (category) => plpIndex.find((plp) => plp.path === `/${category.url_key}`),
  ).filter(clearanceFilter);

  return possiblePLPs || product.categories;
}

export function isPDP() {
  return window.location.href.match(/\/products\/[\w|-]+\/[\w|-]+/) !== null;
}

export async function getProductVariants(sku, options) {
  const response = await performCatalogServiceQuery(
    variantsQuery,
    { sku, optionIds: options || [] },
  );
  return response?.variants;
}

export async function refineProduct(sku, options) {
  const response = await performCatalogServiceQuery(
    refineProductQuery,
    { sku, optionIds: options || [] },
  );
  return response;
}

// TODO Change to performCatalogServiceQuery call
export async function getRelatedProducts(series) {
  const response = await performMonolithGraphQLQuery(
    relatedProductsQuery,
    { series },
  );
  return response;
}

export async function getAccessoriesBySKUs(items) {
  const itemsPromise  = await items;
  if (typeof itemsPromise === 'string') {
    const skus = itemsPromise.split(",");
    const response = await performMonolithGraphQLQuery(
      accessoriesProductsQuery,
      { skus },
    );
    return response;
  }
}
