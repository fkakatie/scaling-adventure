import { toClassName } from '../../scripts/aem.js';
import { buildCarousel } from '../../scripts/utils.js';

/**
 * Builds form label.
 * @param {string} text - Label text
 * @param {boolean} [required=false] - Whether field is required
 * @param {boolean} [disabled=false] - Whether field is disabled
 * @returns {HTMLLabelElement} Label element
 */
function buildLabel(text, required = false, disabled = false) {
  const label = document.createElement('label');
  label.textContent = text;
  label.setAttribute('for', `${toClassName(text)}-options`);
  if (required) label.dataset.required = required;
  if (disabled) label.dataset.disabled = disabled;
  return label;
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
 * Builds options carousel.
 * @param {string} titleText - Title text
 * @param {HTMLElement} content - Content element
 * @returns {Object} Object with label and carousel
 */
function buildOptionsCarousel(titleText, content) {
  const label = buildLabel(titleText);
  // turn images into buttons
  const imgs = content.querySelectorAll('picture');
  imgs.forEach((img) => {
    const text = img.querySelector('img').getAttribute('alt') || null;
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', text);
    button.setAttribute('aria-selected', false);
    button.append(img.cloneNode(true));
    // TODO: add button event listener to fill in selects
    img.replaceWith(button);
  });
  const carousel = buildCarousel(content, 3, false);
  return { label, carousel };
}

/**
 * Builds select input wrapper with default option.
 * @param {string} text - Select field identifier
 * @returns {HTMLDivElement} <div> containing select element
 */
function buildSelect(text) {
  const wrapper = document.createElement('div');
  wrapper.className = 'select-wrapper';
  const select = document.createElement('select');
  select.id = `${toClassName(text)}-options`;
  select.required = true;
  const defaultOption = document.createElement('option');
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = 'Choose an Option...';
  select.append(defaultOption);
  wrapper.append(select);
  return wrapper;
}

/**
 * Builds complete select field.
 * @param {string} labelText - Text for label
 * @param {HTMLElement} content - Content element with options
 * @param {boolean} required - Whether field is required
 * @param {boolean} disabled - Whether field is disabled
 * @param {Function} optionConfig - Function to build options from <li> elements
 * @returns {Object} Object with label and select wrapper
 */
function buildSelectField(labelText, content, required, disabled, optionConfig) {
  const label = buildLabel(labelText, required, disabled);
  const selectWrapper = buildSelect(labelText);
  const select = selectWrapper.querySelector('select');
  select.required = required;
  select.disabled = disabled;
  const options = [...content.querySelectorAll('li')].map(optionConfig);
  select.append(...options);
  return { label, selectWrapper };
}

/**
 * Creates note element for height option messages
 * @param {string} type - Type of height option this note applies to ('standard' or 'height')
 * @param {string} message - Message text to display
 * @param {number} i - Note index
 * @returns {HTMLParagraphElement} Formatted note element
 */
function writeHeightNote(type, message, i) {
  const note = document.createElement('p');
  note.innerHTML = `<strong>Please note:</strong> ${message}`;
  note.dataset.type = type;
  note.setAttribute('aria-hidden', i !== 0);
  return note;
}

export default async function decorate(block) {
  const rows = [...block.children];
  const form = document.createElement('form');
  // track standard selects for sequential enabling/disabling
  let selects = 0;

  // transform each row into a form field
  rows.forEach((row) => {
    row.className = 'options-form-field';
    const [title, content] = [...row.children];
    const titleText = title.textContent.trim();
    const type = titleText.toUpperCase();
    if (type.includes('OPTION')) {
      // build options carousel with image buttons
      const { label, carousel } = buildOptionsCarousel(titleText, content);
      if (carousel) {
        title.replaceWith(label);
        content.replaceWith(carousel);
      }
    } else if (type.includes('HEIGHT')) {
      // build custom height dropdown with price adjustments
      const labelText = `Custom ${titleText}`;
      const { label, selectWrapper } = buildSelectField(
        labelText,
        content,
        false, // not required
        false, // not disabled
        (li) => {
          const text = li.textContent.trim();
          const [prefix, height, price] = text.split(' ').map((t) => t.trim());
          // create option with height value and price data
          const option = document.createElement('option');
          option.dataset.type = prefix.toLowerCase();
          option.dataset.heightValue = extractFloat(height); // extract actual height value
          option.value = extractFloat(price); // extract price and use as value
          option.textContent = text;
          if (prefix === 'Standard') option.selected = true; // auto-select 'Standard' option
          return option;
        },
      );
      title.replaceWith(label);
      content.replaceWith(selectWrapper);

      // build height calculator
      const calculator = document.createElement('p');
      calculator.innerHTML = `Use our <button
          id="calculator"
          type="button"
        >calculator</button> for height recommendation.`;
      row.insertBefore(calculator, selectWrapper);
      calculator.querySelector('button').addEventListener('click', (e) => {
        e.preventDefault();
        // eslint-disable-next-line no-console
        console.log('open the calculator');
      });

      // build height notes
      const messages = {
        standard: 'I acknowledge that I am purchasing an item with a fixed height that is not field adjustable',
        height: 'Customized items are final sale and take an additional 3 business days to ship. In Stock orders can\'t be canceled or modified.',
      };
      Object.entries(messages).forEach(([key, message], i) => {
        const note = writeHeightNote(key, message, i);
        row.append(note);
      });
      // update note based on selected option
      const notes = row.querySelectorAll('[data-note]');
      selectWrapper.addEventListener('change', (e) => {
        const selected = e.target.selectedOptions[0];
        const { type: noteType } = selected.dataset;
        notes.forEach((note) => {
          note.setAttribute('aria-hidden', note.dataset.type !== noteType);
        });
      });
    } else if (type.includes('PRICE')) {
      // build price field
      title.remove();
    } else {
      // otherwise, build standard dropdown select fields with sequential enabling
      selects += 1;
      const { label, selectWrapper } = buildSelectField(
        titleText,
        content,
        true, // required
        selects > 1, // disable all but first select
        (li) => {
          // create simple option text
          const text = li.textContent.trim();
          const option = document.createElement('option');
          option.value = toClassName(text); // TODO: find actual value
          option.textContent = text;
          return option;
        },
      );
      title.replaceWith(label);
      content.replaceWith(selectWrapper);

      // TODO: add select change event to enable select below itself, if exists
    }

    form.append(row);
  });

  // build availability message
  const availability = document.createElement('p');
  availability.className = 'options-form-availability';
  const stock = document.createElement('span');
  stock.id = 'options-form-stock';
  const shipBy = document.createElement('span');
  shipBy.id = 'options-form-shipBy';
  availability.append(stock, shipBy);
  form.append(availability);

  // build add-to-cart
  const cart = document.createElement('div');
  cart.className = 'options-form-cart';
  const label = buildLabel('Quantity');
  const input = document.createElement('input');
  input.id = 'quantity-options';
  input.name = 'quantity-options';
  input.type = 'number';
  input.min = 1;
  input.value = 1;
  cart.append(label, input);
  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Add to Cart';
  cart.append(button);
  form.append(cart);

  // build save to project
  const save = document.createElement('button');
  save.className = 'options-form-save';
  save.type = 'button';
  save.textContent = 'Save to Project';
  form.append(save);

  block.append(form);
}
