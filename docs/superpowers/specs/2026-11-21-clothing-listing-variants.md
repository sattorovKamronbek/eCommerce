# Clothing listings with color and size variants

The owner wants the seller to create one clothing product with multiple sizes,
photos, colors, fabric composition, fit and care information. Buyers should be
able to choose the clothing variant and see its photos before reserving it.
The owner approved the color galleries, per-combination stock, overridable
default price and optional centimeter guide on 2026-11-21.

## Seller workflow

- Enter the product title, category and description. Add fabric composition,
  fit and care details when available.
- Add each offered color and its sizes, including letter sizes, numeric sizes
  or a single size. Attach multiple photos to each color. The first photo is
  its cover.
- Enter a default UZS price and stock per offered color and size combination.
  Set a different price on a combination when needed. Optionally add a size
  guide with measurements in centimeters.
- Save the product as a draft or publish it. Reopen the product to edit
  details and photos or manage offered combinations.
- Save checkout contact and delivery price for the product. New or reactivated
  combinations inherit its current settings.

An example is a polo shirt with black in M and L and white in M. The black
sizes share the black gallery. The seller records three independent stock
counts. White L is unavailable because the seller has not offered it.

## Buyer workflow

One card per product appears in the clothing catalog and search. Its detail
page shows descriptive attributes, a photo gallery, color and size choices,
the size guide when provided, and availability and price for the current
selection. Checkout uses the selected variant's existing listing ID. Existing
clothing listings keep their current catalog and checkout behavior.

## Data and access

An alternative is a shared size list and stock count on one old-style listing.
That would show sizes and photos but could reserve the wrong size once one
size sells out. A new reservation model would allow modeling variants from
scratch and would require changes to order creation, expiry and stock release.
The recommended approach groups clothing variants under a product and retains
the existing listing and reservation transaction for each combination.

The database change is additive in the dedicated VERSAX project. The existing
approved-seller checks and row access rules apply to products and their images.
The product, colors and variants save in a transaction. The editor reads its
fields and stock versions together. Only photos attached
to published, accessible variants are visible to buyers. A draft image preview
requires the seller's authorized session. The existing payment and fulfillment
flow continues to operate on the selected listing.

References include color-specific imagery and size guidance from Uzum Market,
the Ralph Lauren buyer selection flow, and stock per variant from Shopify.
[Uzum seller guide](https://seller.uzum.uz/manual/uz/5.product-creation/)
[Polo Ralph Lauren product page](https://www.ralphlauren.com/men-clothing-polo-shirts/custom-slim-fit-mesh-polo-shirt/582999.html)
[Shopify variant inventory](https://help.shopify.com/en/manual/products/variants/)
