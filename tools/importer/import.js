/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global WebImporter */

/* eslint-disable no-console, class-methods-use-this, function-paren-newline,
implicit-arrow-linebreak */

function generateDocumentPath(url) {
  const { pathname } = new URL(url);
  const initialReplace = new URL(url).pathname
    .replace(/\.html$/, '')
    .replace(/\/$/, '');
  console.log(`pathname: ${pathname} -> initialReplace: ${initialReplace}`);

  return initialReplace;
}

function getCurrentCategory(document, url) {
  const css = Array.from(
    document.querySelector('.breadcrumbs > ul > li:last-child').classList,
  ).pop();

  if (generateDocumentPath(url).includes('our-designers')) {
    // find the value after id in subCategory[0].href and before the next
    const subCategory = document.querySelectorAll('.pages > ul > li > a');
    const category = subCategory[0]?.href?.split('id=')[1].split('&')[0];
    return category;
  }
  return css.replace('category', '');
}

function transformPLP(document, url) {
  const dom = document.getElementById('amasty-shopby-product-list');

  const cells = [
    ['Product List Page Custom'],
    ['category', getCurrentCategory(document, url)],
  ];
  const table = WebImporter.DOMUtils.createTable(cells, document);

  const seperator = document.createElement('p');
  seperator.classList.add('seperator');
  seperator.textContent = '---';
  table.append(seperator);

  dom.replaceWith(table);

  const videoContainer = document.querySelector(
    '.pagebuilder-video-container iframe',
  );

  if (videoContainer) {
    const vidoecells = [['Embed'], [videoContainer.src]];
    const vidoetable = WebImporter.DOMUtils.createTable(vidoecells, document);
    videoContainer.replaceWith(vidoetable);
  }
}

function makeAbsoluteLinks(main) {
  main.querySelectorAll('a').forEach((a) => {
    try {
      const ori = a.href;
      let u;
      if (a.href.startsWith('/')) {
        u = new URL(
          a.href,
          'https://main--adobe-edge--visualcomfort.aem.page/',
        );
      } else {
        u = new URL(a.href);
        u.hostname = 'main--adobe-edge--visualcomfort.aem.page';
      }

      // Remove .html extension
      if (u.pathname.endsWith('.html')) {
        u.pathname = u.pathname.slice(0, -5);
      }

      a.href = u.toString();

      if (a.textContent === ori) {
        a.textContent = a.href;
      }
    } catch (err) {
      console.warn(
        `Unable to make absolute link for ${a.href}: ${err.message}`,
      );
    }
  });
}

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {HTMLElement} The root element to be transformed
   */
  transformDOM: ({
    // eslint-disable-next-line no-unused-vars
    document,
    // eslint-disable-next-line no-unused-vars
    url,
    // eslint-disable-next-line no-unused-vars
    html,
    // eslint-disable-next-line no-unused-vars
    params,
  }) => {
    // use helper method to remove header, footer, etc.
    WebImporter.DOMUtils.remove(document.body, [
      'header',
      'footer',
      '.noscript',
      '.viewer',
      '.page-footer',
      '.filter-menu',
      '.cookie-status-message',
      '.brseo',
      '.back-to-top__btn',
      '.page-title',
    ]);

    const seperator = document.createElement('p');
    seperator.classList.add('seperator');
    seperator.textContent = '---';
    document.body.append(seperator);

    const template = generateDocumentPath(url).includes('our-designers')
      ? 'plp-designer'
      : 'plp';

    const meta = {
      template,
      breadcrumb: generateDocumentPath(url).includes('our-designers') ? 'false' : 'auto',
    };

    const title = document.querySelector('title');
    if (title) {
      meta.Title = title.innerHTML
        .replace(/[\n\t]/gm, '')
        .split('|')[0]
        .trim();
    }

    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      meta.Description = desc.content.replace(/&amp;/gm, '&');
    }

    if (meta.Title) {
      meta.Title = meta.Title.replace(/&amp;/gm, '&');
    }

    document.body.append(WebImporter.Blocks.getMetadataBlock(document, meta));

    [transformPLP, makeAbsoluteLinks].forEach((f) =>
      f.call(null, document, url),
    );

    WebImporter.DOMUtils.remove(document.body, ['.breadcrumbs']);

    // Remove mobile hidden elements, the live site loads both mobile and
    // non-mobileimages and hides one(not too performant I think!);
    WebImporter.DOMUtils.remove(document.body, ['.pagebuilder-mobile-hidden']);

    return document.body;
  },

  /**
   * Return a path that describes the document being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word document.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @return {string} The path
   */
  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document,
    // eslint-disable-next-line no-unused-vars
    url,
    // eslint-disable-next-line no-unused-vars
    params,
  }) => {
    const initialReplace = generateDocumentPath(url);
    return WebImporter.FileUtils.sanitizePath(initialReplace);
  },
};
