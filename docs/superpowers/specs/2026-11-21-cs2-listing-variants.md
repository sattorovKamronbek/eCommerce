# CS2 listings with wear variants

The owner asked sellers to choose the type and model of a CS2 item, select its
wear, set prices per wear and attach multiple photos. The owner selected
separate photos for each variant. A seller creates one skin from Add a listing.
A buyer can switch between its published variants on the listing page.

- Use the existing VERSAX workspace and marketplace styling. List CS2 weapon
  and glove models by category with the in-game names. Use FN, MW, FT, WW and BS
  for painted skins and an unpainted option where applicable.
- Each selected wear has one price in UZS, separate availability and up to
  four seller-provided photos. Related variant pages show their current prices.
  Catalog filters use category, model and wear.
- Each variant is an existing kind of sellable listing with individual stock,
  moderation and checkout terms. Creation writes all variants in one database
  statement. The seller can edit price, stock, description, state and photos on
  a variant after creation. Model and wear identify it throughout its lifetime.
- Store bounded WebP photos in the dedicated project's private Storage bucket.
  Buyer access follows listing visibility. Seller previews follow the existing
  approved-seller permissions. The first photo serves as the listing cover.
  Existing listings continue to use their current fields and checkout terms.

Reference behavior came from the LIS-SKINS category catalog and its
wear selector. The seller supplies prices, stock, and photos.
[CS2 category catalog](https://lis-skins.com/market/csgo/)
[Example wear selector](https://lis-skins.com/market/csgo/desert-eagle-mecha-industries-factory-new/)
