import { getConfigValue } from '../../scripts/configs.js';
import { readBlockConfig } from '../../scripts/aem.js';
import { buildCarousel } from '../../scripts/utils.js';

const BASE_URL = 'https://photorankapi-a.akamaihd.net';
const VERSION = 'v2.2';

/**
 * Constructs media URL for fetching social feed content.
 * @param {string} stream - Stream identifier
 * @param {string} key - Auth key
 * @param {string} order - Order of media items
 * @param {number} count - Number of items to fetch
 * @returns {Promise<URL|null>} Constructed media URL, or `null` if error
 */
async function writeMediaUrl(stream, key, order, count) {
  const url = new URL(BASE_URL);
  url.pathname = `/streams/bytag/${stream}`;
  url.searchParams.append('version', VERSION);
  url.searchParams.append('auth_token', key);

  try {
    const resp = await fetch(url.href);
    const json = await resp.json();
    if (!json && !json.data) throw new Error(json);
    const { id } = json.data;
    // const dir = data._embedded.customer.template_dir;
    const media = new URL(BASE_URL);
    media.pathname = `/streams/${id}/media/${order}`;
    media.searchParams.append('version', VERSION);
    media.searchParams.append('count', count);
    media.searchParams.append('auth_token', key);
    return media;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Could not build social feed from', stream, error);
  }
  return null;
}

/**
 * Fetches social media data from the constructed URL
 * @param {URL} url - URL to fetch data from
 * @returns {Promise<void>}
 */
async function fetchSocialData(url) {
  try {
    const resp = await fetch(url);
    const json = await resp.json();
    if (!json && !json.data) throw new Error(json);
    // eslint-disable-next-line no-unused-vars
    const { data } = json;
    // console.log('LOG: > fetchSocialData > data:', data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Could not build social feed from', url, error);
  }
}

export default async function decorate(block) {
  const {
    tag, count, order, stream,
  } = readBlockConfig(block);
  block.innerHTML = '';

  // build tag
  if (tag) {
    const text = document.createElement('p');
    text.className = 'feed-tag';
    text.textContent = tag.startsWith('#') ? tag : `#${tag}`;
    block.append(text);
  }

  // build slide
  const wrapper = document.createElement('div');
  const slider = document.createElement('ul');
  slider.className = 'feed-slider';
  wrapper.append(slider);
  block.append(wrapper);

  // build placeholder(s)
  const ph = document.createElement('li');
  ph.className = 'feed-placeholder';
  ph.textContent = 'Add your photo for a chance to be featured!';
  slider.append(ph);

  // transform into carousel
  const carousel = buildCarousel(wrapper, 1, false);
  if (carousel) wrapper.replaceWith(carousel);

  // initialize intersection observer to load social data when block becomes visible
  const observer = new IntersectionObserver(async () => {
    observer.disconnect();
    const apiKey = await getConfigValue('olapic-api-key');
    const url = await writeMediaUrl(stream, apiKey, order, count);
    // fetch social data
    fetchSocialData(url, count, order);
  }, { threshold: 0 });

  observer.observe(block);
}
