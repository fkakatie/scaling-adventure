# Storage

This directory contains the file(s) that provide helper methods for other files to access the local
storage items that are treated the same way that Magento handles them - storing the items in
`mage-cache-storage`, tracking their invalidation status in `mage-cache-storage-section-invalidation`,
tracking the cache timeout in `mage-cache-timeout`, etc.

This is also where the actual contact with Magento is happening to refresh the local storage cache and
store the information coming directly from Magento.

**Note: this requires that the endpoint `/customer/section/load` is routed to Magento.**

# Mock data for Minicart and Account dropdown

The app relies on data stored in localStorage and cookies which is created by the Magento site. This data is only accessible when running the Edge Delivery site on the same URL domain as the Magento site. Since it can be tricky and cumbersome setting this up in a local environment (e.g. you need a self-signed cert, modify your /etc/hosts file, bypass SSL errors and CORS, etc.), a simpler workaround is to hard-code this localStorage data into the storage/util.js file that reads from this cache. 

```
const LOCAL_MAGE_CACHE = {
  "cart": {
      "summary_count": 48,
      "subtotalAmount": "15762.0000",
      "subtotal": "<span class=\"price\">$15,762.00</span>",
      "possible_onepage_checkout": true,
      "items": [
          {
              "product_type": "configurable",
              "options": [
                  {
                      "label": "Finish",
                      "value": "Plaster White and Clear Swirled Glass",
                      "option_id": 2461,
                      "option_value": "52291"
                  }
              ],
              "qty": 1,
              "item_id": "10929011",
              "configure_url": "https://stage3.visualcomfort.com/checkout/cart/configure/id/10929011/product_id/287543/",
              "style": "",
              "is_visible_in_site_visibility": true,
              "product_id": "287543",
              "product_name": "Talia 46&quot; Chandelier",
              "product_sku": "JN 5122PW/CG",
              "product_url": "https://stage3.visualcomfort.com/talia-46-chandelier-jn5122/",
              "product_has_url": true,
              "product_price": "\n\n    <span class=\"price-excluding-tax\" data-label=\"Excl.&#x20;Tax\">\n            <span class=\"minicart-price\">\n            <span class=\"price\">$4,999.00</span>        </span>\n\n        </span>\n",
              "product_price_value": 4999,
              "full_price": "4,999.00",
              "category": "Ceiling/Chandelier/Julie Neill/Shop All/Cascading Chandeliers",
              "product_image": {
                  "src": "https://stage3.visualcomfort.com/media/catalog/product/J/N/JN5122PWCG.png?width=165&height=165&canvas=165,165&optimize=medium&fit=bounds",
                  "alt": "Talia 46\" Chandelier in Plaster White and Clear Swirled Glass",
                  "width": 165,
                  "height": 165
              },
              "canApplyMsrp": false,
              "brand": "Signature Collection",
              "custom_height_value": null
          },
          {
              "product_type": "simple",
              "options": [],
              "qty": 45,
              "item_id": "10929008",
              "configure_url": "https://stage3.visualcomfort.com/checkout/cart/configure/id/10929008/product_id/253922/",
              "style": "",
              "is_visible_in_site_visibility": true,
              "product_id": "253922",
              "product_name": "5.5W B11 Clear LED Dimmable E12 Candelabra Base 500lm 2700k 120V",
              "product_sku": "LB 355664",
              "product_url": "https://stage3.visualcomfort.com/5-5w-b11-clear-led-dimmable-e12-candelabra-base-500lm-2700k-120v/",
              "product_has_url": true,
              "product_price": "\n\n    <span class=\"price-excluding-tax\" data-label=\"Excl.&#x20;Tax\">\n            <span class=\"minicart-price\">\n            <span class=\"price\">$17.00</span>        </span>\n\n        </span>\n",
              "product_price_value": 17,
              "full_price": "17.00",
              "category": "Bulbs",
              "product_image": {
                  "src": "https://stage3.visualcomfort.com/media/catalog/product/l/b/lb355664_2.png?width=165&height=165&canvas=165,165&optimize=medium&fit=bounds",
                  "alt": "5.5W B11 Clear LED Dimmable E12 Candelabra Base 500lm 2700k 120V",
                  "width": 165,
                  "height": 165
              },
              "canApplyMsrp": false,
              "brand": "Light Bulbs",
              "custom_height_value": null
          },
          {
              "product_type": "configurable",
              "options": [
                  {
                      "label": "Finish",
                      "value": "Gild and Clear Swirled Glass",
                      "option_id": 2461,
                      "option_value": "52281"
                  }
              ],
              "qty": 2,
              "item_id": "10929002",
              "configure_url": "https://stage3.visualcomfort.com/checkout/cart/configure/id/10929002/product_id/287543/",
              "style": "",
              "is_visible_in_site_visibility": true,
              "product_id": "287543",
              "product_name": "Talia 46&quot; Chandelier",
              "product_sku": "JN 5122G/CG",
              "product_url": "https://stage3.visualcomfort.com/talia-46-chandelier-jn5122/",
              "product_has_url": true,
              "product_price": "\n\n    <span class=\"price-excluding-tax\" data-label=\"Excl.&#x20;Tax\">\n            <span class=\"minicart-price\">\n            <span class=\"price\">$4,999.00</span>        </span>\n\n        </span>\n",
              "product_price_value": 4999,
              "full_price": "4,999.00",
              "category": "Ceiling/Chandelier/Julie Neill/Shop All/Cascading Chandeliers",
              "product_image": {
                  "src": "https://stage3.visualcomfort.com/media/catalog/product/J/N/JN5122GCG.png?width=165&height=165&canvas=165,165&optimize=medium&fit=bounds",
                  "alt": "Talia 46\" Chandelier in Gild and Clear Swirled Glass",
                  "width": 165,
                  "height": 165
              },
              "canApplyMsrp": false,
              "brand": "Signature Collection",
              "custom_height_value": null
          }
      ],
      "extra_actions": "",
      "isGuestCheckoutAllowed": true,
      "website_id": "1",
      "storeId": "1",
      "mfpValue": null,
      "learnMore": "true",
      "allow_affirm_quote_aslowas": false,
      "cart_empty_message": "",
      "subtotal_incl_tax": "<span class=\"price\">$15,762.00</span>",
      "subtotal_excl_tax": "<span class=\"price\">$15,762.00</span>",
      "zero_inventory_items_ids": [
          "10929002",
          "10929011"
      ],
      "data_id": 1714879309
  },
  "custom_height_availability_message": {
      "message": "Please note: Customized items are final sale and take an additional 3 business days to ship. In Stock orders can't be cancelled or modified.",
      "data_id": 1714879309
  },
  "company": {
      "data_id": 1714879309
  },
  "customer": {
    "fullname": "Test Account",
    "firstname": "Test",
    "websiteId": "1",
    "userEmail": "test-qa1-wholesale@n8ko5unu.mailosaur.net",
    "hashedEmail": "b479fdd0de66f26e0b954b929f8318dd8fe186e415903d1bc7e4a0aad048169d",
    "loggedinStatus": 1,
    "currencyCode": "USD",
    "tradeCustomer": "0",
    "customerClass": "",
    "companyType": "wholesale",
    "uniqueId": "ca4adeb7cfac9d98d08d99360a02cba1fd517586f4c60cb17dd3b3d8fc805929",
    "data_id": 1714963187
  },
  "side-by-side":{"cart_id":"edKWUJMzB40P4mJGrJGYDIgIWaSd1uTH","data_id":1714873870}
}    
```

Then, in the `getMagentoCache()` function further below that file, add this conditional to check if the current env is 'localhost' and return the hard-coded data if true:

```
if (window.location.hostname === 'localhost') {
    return LOCAL_MAGE_CACHE;
}
```

If you want to update this data with real data from the hosted Magento environment, you can copy a snapshot of your current localStorage object from the browser tab of the hosted environment with `JSON.parse(localStorage.getItem('mage-cache-storage'))`. Right-click on this object in Dev Tools and select Copy Object, then you can paste that object as the LOCAL_MAGE_CACHE object in storage/utils.js
