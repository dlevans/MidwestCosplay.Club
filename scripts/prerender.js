// Runs after `react-scripts build`.
//
// The app builds to one empty index.html, so anything that doesn't run JavaScript
// (some crawlers, link previews, and AdSense's site review) sees a blank page.
// This writes a copy of index.html for each public page with that page's title,
// description, and a text summary already inside <div id="root">. React replaces
// the summary as soon as the app loads.
//
//   build/index.html          → the home page
//   build/pages/<name>.html   → served for /<name> by the rule in dothtaccess

const fs = require("fs");
const path = require("path");

const SITE = "https://midwestcosplay.club";
const build = path.join(__dirname, "..", "build");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const nav = [
  ["/", "Home"],
  ["/tutorials", "Tutorials"],
  ["/templates", "Templates"],
  ["/measurements", "Measurement tools"],
  ["/storemap", "Fabric & craft stores"],
  ["/calendar", "Events calendar"],
  ["/events", "Events"],
  ["/groups", "Groups"],
  ["/privacy", "Privacy policy"],
];

// Each page: route, <title>, meta description, heading, and body paragraphs/lists.
// Keep the wording in step with the real pages in src/.
const pages = [
  {
    route: "/",
    title: "Midwest Cosplay Club – Cosplay Community, Events & Tutorials",
    description:
      "Midwest Cosplay Club connects cosplayers across the Midwest. Find local cosplay events and meetups, groups, tutorials, patterns, measurement tools, and fabric stores.",
    heading: "Midwest Cosplay Club",
    body: [
      "Whether you're threading your first seams or debuting a five-year masterpiece, you belong here — among dreamers, makers, and the wonderfully devoted.",
      "Midwest Cosplay Club is a free community for cosplayers in Kansas, Missouri, and across the Midwest. Whether you sew, build armor, sculpt foam, style wigs, or wire up LEDs, it's a place to meet other makers, find local events, and pick up new skills.",
      { h2: "What you'll find here" },
      {
        links: [
          ["/tutorials", "Tutorials", "Step-by-step guides from the community on sewing, armor, foam, props, wigs, and makeup."],
          ["/templates", "Patterns & Templates", "Free and paid sewing patterns, armor templates, and prop templates, sorted by category."],
          ["/measurements", "Measurement Tools", "Save body measurements for pattern sizing, scale templates and props up or down, and work out resistor values for LED builds."],
          ["/storemap", "Fabric & Craft Stores", "A community-built map of fabric, bead, art supply, and craft stores across the Midwest."],
          ["/calendar", "Events Calendar", "Conventions, meetups, and photoshoots around the region, all in one calendar."],
          ["/groups", "Groups", "Find cosplay groups near you, or start one for your fandom or crew."],
        ],
      },
      "Members can build a cosplay profile to show off finished and in-progress costumes, link their socials and shops, start or join groups, and post events.",
    ],
  },
  {
    route: "/tutorials",
    title: "Cosplay Tutorials — Midwest Cosplay Club",
    description: "Cosplay tutorials for sewing, armor, foam, props, wigs, and makeup, shared by the Midwest Cosplay Club community.",
    heading: "Cosplay Tutorials",
    body: [
      "Tutorials shared by Midwest Cosplay Club members and the wider cosplay community, covering sewing, armor and foam work, props, wigs, makeup, helmets and headgear, and more.",
      "Browse by category or search for a technique. Each tutorial links to the full guide or video, along with who shared it. Members can submit their own favorite tutorials to share with the club.",
    ],
  },
  {
    route: "/templates",
    title: "Cosplay Patterns & Templates — Midwest Cosplay Club",
    description: "Free and paid cosplay sewing patterns, armor templates, and prop templates shared by the Midwest Cosplay Club community.",
    heading: "Cosplay Patterns & Templates",
    body: [
      "A library of sewing patterns, foam armor templates, and prop templates for cosplay, both free and paid, shared by the community.",
      "Filter by category, such as costumes, armor, helmets and headgear, or props, to find a starting point for your next build. Members can add templates they recommend.",
    ],
  },
  {
    route: "/measurements",
    title: "Cosplay Measurement Tools — Midwest Cosplay Club",
    description: "Free cosplay measurement tools: body measurement and sizing chart, shape and area calculator, and electronics calculators for props.",
    heading: "Cosplay Measurement Tools",
    body: [
      "Free calculators to help plan costumes and props.",
      {
        links: [
          ["/bodymeasurements", "Body Measurements", "Manage sizing profiles, height scales, and tailored dimensions."],
          ["/shapemeasurements", "Shape Calculators", "Calculate dimensions, areas, and segment lengths for geometric foam props."],
          ["/electricalmeasurements", "LED & Electronics", "Determine power requirements, wiring schemas, and resistors for custom lit builds."],
        ],
      },
    ],
  },
  {
    route: "/bodymeasurements",
    title: "Cosplay Body Measurement Chart & Sizing Tool — Midwest Cosplay Club",
    description: "Record and convert your body measurements for cosplay sewing and pattern sizing with this free measurement tool.",
    heading: "Body Measurement Chart & Sizing Tool",
    body: [
      "Save a set of body measurements, such as chest or bust, waist, and hips, for yourself or for a character you're building.",
      "Keeping an accurate set of measurements makes it much easier to pick the right pattern size, scale armor templates, and fit a costume before the con.",
    ],
  },
  {
    route: "/shapemeasurements",
    title: "Shape & Area Calculator for Cosplay — Midwest Cosplay Club",
    description: "Scale factor calculator for resizing cosplay patterns, armor templates, and props.",
    heading: "Shape Tools & Calculators",
    body: [
      "The Scale Factor Solver resizes a pattern, template, or prop: fill in any two of the original size, the new size, and the scale factor, and it works out the missing one.",
      "Handy for scaling a template printed at the wrong size, or for sizing a prop to match a reference image.",
    ],
  },
  {
    route: "/electricalmeasurements",
    title: "Cosplay Electronics Calculators — Midwest Cosplay Club",
    description: "Resistor color code and resistance calculators for wiring LEDs and electronics in cosplay props and armor.",
    heading: "Electrical Utilities",
    body: [
      "Calculators for wiring LEDs and electronics into costumes, props, and armor: a resistance calculator and a resistor color code reader.",
      "Work out the resistor you need before you solder, or read the color bands on one you already have.",
    ],
  },
  {
    route: "/storemap",
    title: "Fabric & Craft Store Map — Midwest Cosplay Club",
    description: "Community-sourced map of fabric, bead, art supply, and craft stores for cosplayers across the Midwest.",
    heading: "Fabric & Craft Stores",
    body: [
      "Community-sourced shops for fabric, beads, art supplies, sewing classes, and cosplay crafting across Kansas, Missouri, and the greater Midwest.",
      "Search by name, city, or state, filter by store type, and see each shop on the map with its address, phone number, and hours.",
    ],
  },
  {
    route: "/calendar",
    title: "Cosplay Events Calendar — Midwest Cosplay Club",
    description: "Calendar of cosplay conventions, meetups, and events across the Midwest.",
    heading: "Midwest Cosplay Events Calendar",
    body: [
      "A public calendar of cosplay conventions, meetups, photoshoots, and community events across the Midwest.",
      "To add your event to this public calendar, invite MidwestCosplay.Club at gmail dot com.",
    ],
  },
  {
    route: "/events",
    title: "Cosplay Events — Midwest Cosplay Club",
    description: "Cosplay conventions, meetups, and photoshoots across the Midwest.",
    heading: "Cosplay Events",
    body: [
      "Cosplay conventions, meetups, and photoshoots posted by Midwest Cosplay Club members.",
      "See what's coming up, who's going, and plan your costumes. Members can post their own events and mark which ones they're attending.",
    ],
  },
  {
    route: "/groups",
    title: "Cosplay Groups — Midwest Cosplay Club",
    description: "Find and join cosplay groups across the Midwest.",
    heading: "Cosplay Groups",
    body: [
      "Find cosplay groups across the Midwest, from fandom crews to local meetup groups.",
      "Each group has its own page with its members and events. Members can start a group and invite others to join.",
    ],
  },
  {
    route: "/privacy",
    title: "Privacy Policy — Midwest Cosplay Club",
    description: "How Midwest Cosplay Club handles account information, cookies, analytics, and advertising.",
    heading: "Privacy Policy",
    body: [
      "This policy explains what information MidwestCosplay.Club collects, how it is used, and the choices you have, including account details, profile information, Google Analytics, and Google AdSense advertising cookies.",
    ],
  },
];

function bodyHtml(page) {
  const parts = page.body.map((b) => {
    if (typeof b === "string") return `<p>${esc(b)}</p>`;
    if (b.h2) return `<h2>${esc(b.h2)}</h2>`;
    if (b.links) {
      return `<ul>${b.links
        .map(([href, label, text]) => `<li><a href="${href}"><strong>${esc(label)}</strong></a>: ${esc(text)}</li>`)
        .join("")}</ul>`;
    }
    return "";
  });
  const links = nav.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join(" · ");
  return `<div class="static-page"><nav>${links}</nav><main><h1>${esc(page.heading)}</h1>${parts.join("")}</main></div>`;
}

function render(template, page) {
  const url = SITE + (page.route === "/" ? "/" : page.route);
  const title = esc(page.title);
  const description = esc(page.description);
  return template
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${title}</title>`)
    .replace(/<meta name="description"[^>]*>/, () => `<meta name="description" content="${description}"/>`)
    .replace(/<meta property="og:title"[^>]*>/, () => `<meta property="og:title" content="${title}"/>`)
    .replace(/<meta property="og:description"[^>]*>/, () => `<meta property="og:description" content="${description}"/>`)
    .replace(/<meta name="twitter:title"[^>]*>/, () => `<meta name="twitter:title" content="${title}"/>`)
    .replace(/<meta name="twitter:description"[^>]*>/, () => `<meta name="twitter:description" content="${description}"/>`)
    .replace("</head>", () => `<link rel="canonical" href="${url}"/></head>`)
    .replace('<div id="root"></div>', () => `<div id="root">${bodyHtml(page)}</div>`);
}

const templatePath = path.join(build, "index.html");
const template = fs.readFileSync(templatePath, "utf8");
if (!template.includes('<div id="root"></div>')) {
  console.error('prerender: build/index.html has no empty <div id="root"></div>; was it already prerendered?');
  process.exit(1);
}

// Keep an untouched copy as the fallback for every other route (login, profiles, etc.).
fs.writeFileSync(path.join(build, "app.html"), template);

const outDir = path.join(build, "pages");
fs.mkdirSync(outDir, { recursive: true });
for (const page of pages) {
  const html = render(template, page);
  if (page.route === "/") fs.writeFileSync(templatePath, html);
  else fs.writeFileSync(path.join(outDir, `${page.route.slice(1)}.html`), html);
}
console.log(`prerender: wrote static text for ${pages.length} pages`);
