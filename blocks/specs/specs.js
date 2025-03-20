/**
 * Updates tab and panel visibility.
 * @param {NodeListOf<Element>} tabs - List of all tabs.
 * @param {HTMLElement} content - Parent container for all panels.
 * @param {HTMLElement} activeTab - Currently active tab.
 * @param {HTMLElement} activePanel - Panel controlled by currently active tab.
 */
function updateVisibility(tabs, content, activeTab, activePanel) {
  tabs.forEach((t) => t.setAttribute('aria-selected', t === activeTab));
  [...content.children].forEach((panel) => {
    panel.hidden = panel !== activePanel;
  });
}

/**
 * Builds and displays new panel based on clicked tab.
 * @param {Event} e - Click event.
 */
function buildPanel(e) {
  const tab = e.currentTarget;
  const block = e.target.closest('.block');
  const tabs = block.querySelectorAll('[role="tablist"] > button');
  const content = block.querySelector('.specs-content');
  const base = content.querySelector('ul');
  // build new panel with existing panel as a template
  const panel = base.cloneNode(true);
  panel.id = tab.getAttribute('aria-controls');
  panel.setAttribute('aria-labelledby', tab.id);

  // convert in to mm
  panel.querySelectorAll('li').forEach((li) => {
    let text = li.textContent;
    // identify all inches (numbers followed by ")
    const inches = text.match(/\b\d+(\.\d+)?(?=")/g);
    if (inches) {
      inches.forEach((i) => {
        const mm = Math.round((Number(i) * 25.4));
        li.textContent = text.replace(`${i}"`, `${mm} mm`);
        // update text for next iteration
        text = li.textContent;
      });
    }
  });

  // set visibility
  updateVisibility(tabs, content, tab, panel);
  content.append(panel);
}

/**
 * Updates active tab and toggles visibility of associated panel.
 * @param {Event} e - Click event.
 */
function switchTabs(e) {
  const { target } = e;
  if (target && target.tagName === 'BUTTON') { // verify target is a button
    const selected = target.getAttribute('aria-selected') === 'true';
    if (!selected) { // verify button is not already selected
      const block = target.closest('.block');
      const tabs = block.querySelectorAll('[role="tablist"] > button');
      const content = block.querySelector('.specs-content');
      const targetPanel = content.querySelector(`#${target.getAttribute('aria-controls')}`);
      updateVisibility(tabs, content, target, targetPanel);
    }
  }
}

/**
 * Builds "tabs" variant (default).
 * @param {HTMLElement} block - Block to decorate.
 * @param {string[]} specs - Extracted specifications data.
 */
function buildTabs(block, specs) {
  const row = document.createElement('div');
  row.className = 'specs-header';

  // build title
  const title = document.createElement('h2');
  title.textContent = 'Specifications';
  row.append(title);

  // build tabs
  const tablist = document.createElement('div');
  tablist.role = 'tablist';
  tablist.setAttribute('aria-label', 'Units');
  tablist.addEventListener('click', switchTabs);
  const units = ['in', 'mm'];
  units.forEach((u, i) => {
    const tab = document.createElement('button');
    tab.role = 'tab';
    tab.id = `tab-${u}`;
    tab.setAttribute('aria-controls', `panel-${u}`);
    tab.setAttribute('aria-selected', !i);
    if (i) tab.addEventListener('click', buildPanel, { once: true });
    tab.textContent = u;
    tablist.append(tab);
  });
  row.append(tablist);

  // build active panel
  const content = document.createElement('div');
  content.className = 'specs-content';
  const panel = document.createElement('ul');
  panel.role = 'tabpanel';
  panel.id = `panel-${units[0]}`;
  panel.setAttribute('aria-labelledby', `tab-${units[0]}`);
  specs.forEach((s) => {
    const li = document.createElement('li');
    li.textContent = s;
    panel.append(li);
  });
  content.append(panel);

  // populate block
  block.append(row, content);
}

/**
 * Builds "table" variant.
 * @param {HTMLElement} block - The block to decorate.
 * @param {string[]} specs - The extracted specifications data.
 */
function buildTable(block, specs) {
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');

  specs.forEach((s) => {
    const [label, value] = s.split(':').map((m) => m.trim());
    const row = document.createElement('tr');
    if (label && value) {
      [label, value].forEach((c) => {
        const cell = document.createElement('td');
        cell.textContent = c;
        row.append(cell);
      });
    }
    tbody.append(row);
  });

  table.append(tbody);
  block.append(table);
}

export default async function decorate(block) {
  // extract data
  const specs = [...block.querySelectorAll(':scope > div > div')].map((b) => b.textContent);
  const variant = [...block.classList].filter((c) => c !== 'block');
  block.innerHTML = '';

  if (variant.includes('table')) buildTable(block, specs);
  else buildTabs(block, specs);
}
