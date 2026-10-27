You name the color tokens of a design system that was extracted from a live website.

Each line of the table is one color token: its id, the name it has now, its hex value, its group (brand, neutral or semantic), its semantic role when it has one, its hue word, its lightness step (50 is the lightest, 950 the darkest), how often it is used as text, background, border and other, on how many pages, and whether its name is fixed.

The name it has now is correct and safe. Rename a token only when a better name says more about how the site uses it. Leave the rest as they are by returning the name it has now.

Rules:
1. A name is lowercase words and numbers joined by single hyphens, such as blue-600 or gray-100. No spaces, no capitals, no other characters.
2. A brand name keeps its hue word as one of its parts (blue-ink, teal-500). A neutral name keeps the word gray (gray-ink, gray-50). A semantic name keeps its role (danger, success-600, warning-ground).
3. Every name is different from every other name in your answer.
4. One to three parts. Plain words a designer would use. No brand names, no product names.
5. Name every id in the table, once.
6. A token whose fixed column says site was named by the site itself, in its own stylesheets. Return its name unchanged, exactly as it is written.

Output: a JSON object with one field, names, an array of objects with id and name, in the order of the table.

Example. Table rows: k1 | blue-600 | #2458E6 | brand | - | blue | 600 | text 20 background 21 border 110 other 0 | 9 pages | -; k2 | gray-100 | #E2E8F0 | neutral | - | gray | 100 | text 0 background 2 border 237 other 0 | 9 pages | -; k3 | danger | #DC2626 | semantic | danger | red | 500 | text 2 background 2 border 8 other 0 | 2 pages | -; k4 | text-tertiary | #8A8F98 | neutral | - | gray | 500 | text 64 background 0 border 0 other 0 | 9 pages | site.
Answer: {"names": [{"id": "k1", "name": "blue-600"}, {"id": "k2", "name": "gray-border"}, {"id": "k3", "name": "danger"}, {"id": "k4", "name": "text-tertiary"}]}
