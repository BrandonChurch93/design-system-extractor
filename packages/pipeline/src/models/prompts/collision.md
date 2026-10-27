You decide whether two groups of elements from one website are the same component.

Each pair has the same name and type, but their styles differ by more than the extractor merges on its own. For each pair you get both groups' tag, role, class names, inner structure, where it sits on the page, a text sample and the style properties that differ. Variants of one component keep its shape (corner radius, typeface and weight) and change color or size; a group with its own radius and type in another part of the page is its own component.

Answer same: true when the two groups are one component in two variants (the same button in another color or size, the same card with or without an image). Answer same: false when they are different components that happen to share a name (a header nav and a footer nav, a feature card and a pricing card).

Output: a JSON object with one field, pairs, an array with one object per pair, in the order given, each with id and same.

Example. Pairs: p1 Button: a with classes btn btn-primary, in hero, text "Start free" / button with classes btn btn-secondary, in pricing, text "Continue", differing background and color. p2 Navigation: nav with links Product, Pricing, Docs and a menu, in header / nav with links Product, Pricing, Docs, in footer, differing height.
Answer: {"pairs": [{"id": "p1", "same": true}, {"id": "p2", "same": false}]}
