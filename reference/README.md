# Reference

Approved references. None of these is a pixel spec; `docs/design/*` wins where they differ.

- `page-flow/*.html` · the approved structure mock of every core page, as wireframes with a neutral skin. Open in a browser. They were built as desktop wireframes before the responsive and provenance decisions (D-007, D-008), so their mobile behavior and their component source lines are superseded by `docs/design/pages.md` and `docs/design/components.md`. The product is called "Specimen" in these files; that name is superseded by D-001.
- `direction-a.html` · the approved visual direction, Studio (D-002): the run page top in the real skin, with a phone layout. The tokens in `docs/design/design-system.md` are the implementation; this file shows the intent.
- `genui-design-system/` · the README and tokens of the owner's previous project's design system. It is the quality reference for how rigorous `docs/design/design-system.md`, the catalog and the component documentation should be. It is a sibling: the same hand and the same discipline. Do not copy its coral accent (this product has no accent), its component set, or its density system.

Markup in these files uses `x-dc` and `helmet` wrapper tags from the mock tool they were made in. Ignore the wrappers; the markup and CSS inside them render normally in a browser.
