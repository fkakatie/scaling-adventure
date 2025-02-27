import { readBlockConfig } from '../../scripts/aem.js';

function getDesignerHighlightFragments(index, pathPrefix) {
  const fragments = [];
  index.data.forEach((fragment) => {
    if (fragment.path.startsWith(pathPrefix)) {
      fragments.push(fragment);
    }
  });
  return fragments;
}

export async function loadHighlight(block, pathPrefix) {
  // eslint-disable-next-line import/no-cycle
  const { fetchIndex } = await import('../../scripts/scripts.js');
  const { loadFragment } = await import('../fragment/fragment.js');
  const index = await fetchIndex('query-index');

  if (!index) {
    // eslint-disable-next-line no-console
    console.warn('No index found for designers highlights');
    block.closest('.section').remove();
    return;
  }
  const highlights = getDesignerHighlightFragments(index, pathPrefix);

  if (highlights.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('No highlights found for designers highlights');
    block.closest('.section').remove();
    return;
  }

  // Pick a random highlight to display
  const highlight = highlights[Math.floor(Math.random() * highlights.length)];
  loadFragment(highlight.path).then((fragment) => {
    block.appendChild(fragment);
  });
}

export default async function decorate(block) {
  const config = readBlockConfig(block);

  block.innerHTML = '';

  if (!config || !config['path-prefix']) {
    // eslint-disable-next-line no-console
    console.warn('Invalid config for designers highlights');
    return;
  }

  block.dataset.pathPrefix = config['path-prefix'];
  block.parentElement.parentElement.classList.add('hidden');

  // loadHighlight(block, config['path-prefix']);
}
