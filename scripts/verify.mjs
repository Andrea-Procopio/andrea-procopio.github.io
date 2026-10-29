import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {dirname,resolve,join} from 'node:path';
const originalPages=['index.html','research.html','career.html'];
const pages=[...originalPages,'press.html','press/bainsa-forbes.html','press/corriere-adriatico.html'];
const css=readFileSync('style.css','utf8');
for(const page of pages){
  const html=readFileSync(page,'utf8');
  assert.ok(!html.includes('embedded-site-styles'),page+' must use the shared stylesheet only');
  assert.ok(html.includes('style.css?v=20261029-spacing-v3'),page+' CSS version mismatch');
  if(originalPages.includes(page)) assert.ok(html.includes('main.js?v=20261019-crows-v1'),page+' script version mismatch');
  const nav=html.match(/<nav aria-label="Main navigation">([\s\S]*?)<\/nav>/)?.[1]||'';
  assert.ok(['Home','Research','Career','Press'].every(label=>nav.includes('>'+label+'</a>')),page+' missing navigation');
  assert.equal(html.split('<h1 ').length-1,1,page+' needs exactly one h1');
  assert.ok(!html.includes('class="wordmark"'),page+' should not include top Andrea Procopio link');
  // Resolve relative paths from each page, including nested English articles.
  for(const match of html.matchAll(/(?:href|src)="([^"?#]+)(?:[?#][^"]*)?"/g)){
    const url=match[1];
    if(/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url))continue;
    let target=resolve(dirname(page),url);
    if(url.endsWith('/'))target=join(target,'index.html');
    assert.ok(existsSync(target),page+' broken local link or asset: '+url);
  }
}
// All shared pages must use the actual favicon asset as their OG/WhatsApp preview.
for(const page of pages){
  const head=readFileSync(page,'utf8').split('</head>')[0];
  assert.ok(head.includes('<meta property="og:image" content="https://andrea-procopio.github.io/assets/icon1.jpg">'),page+' incorrect social preview image');
  assert.ok(head.includes('<meta property="og:image:type" content="image/jpeg">'),page+' missing OG image type');
  assert.ok(!head.includes('property="og:image" content="https://andrea-procopio.github.io/assets/profile.jpeg"'),page+' outdated preview');
}
// Vector arrows avoid the iOS emoji font on every page.
for(const page of pages){
  const body=readFileSync(page,'utf8').split('</head>')[1]||'';
  assert.ok(!body.includes('↗'),page+' must not use Unicode emoji-prone arrows');
  assert.ok(body.includes('class="link-arrow-icon"'),page+' missing vector icons');
}
assert.ok(css.includes('.link-arrow-icon{')&&css.includes('fill:none;stroke:currentColor'),'Arrows must render as unfilled vector strokes');

const home=readFileSync('index.html','utf8');
const research=readFileSync('research.html','utf8');
const career=readFileSync('career.html','utf8');
const js=readFileSync('main.js','utf8');
assert.ok(home.includes('assets/profile.jpeg')&&home.includes('id="contact"'));
const contact=home.split('<section class="contact-home page-width"')[1]?.split('</section>')[0]||'';
assert.equal((contact.match(/class="contact-method"/g)||[]).length,2,'Contact must have exactly two editorial links');
assert.ok(contact.includes('href="mailto:procopio@mit.edu"'),'Missing email destination');
assert.ok(contact.includes('href="https://www.linkedin.com/in/procopioandrea/"'),'Missing LinkedIn destination');
assert.ok(contact.includes('procopio@mit.edu')&&contact.includes('linkedin.com/in/procopioandrea'),'Contact methods should show their destinations');
assert.ok(!contact.includes('GitHub')&&!contact.includes('github.com'),'GitHub must not appear in contact section');
assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'Desktop contact links must have two equal columns');
assert.ok(css.includes('.page-home .contact-list{grid-template-columns:minmax(0,1fr);gap:0}'),'Mobile contact links must stack');

const biography=home.split('<div class="introduction">')[1]?.split('</div>')[0]||'';
assert.equal((biography.match(/<p>/g)||[]).length,4,'Landing biography must have exactly four paragraphs');
for(const phrase of [
  "I'm a PhD student at MIT working with Prof. Dimitris Bertsimas, and a Research Fellow at Harvard.",
  'reliably and meaningfully automate scientific discovery',
  'continual learning and recursive self improvement',
  'raise the median quality of life.',
  'I studied Computer Science and Economics at Bocconi. My thesis grew out of research with Prof. Tomer Ullman',
  'Harvard’s Computation, Cognition, and Development Lab, where I continue to collaborate.',
  'Italy’s largest student-run AI research lab',
  'a community for European founders under 26.'
]) assert.ok(biography.includes(phrase),'Missing biography copy: '+phrase);
assert.ok(biography.includes('href="https://bainsa.ai/"'),'BAINSA link missing from biography');
assert.ok(biography.includes('href="https://www.eurotech-federation.com"'),'EuroTech link missing from biography');
assert.ok(!biography.includes('recursive self-improvement'),'The phrase must not contain a hyphen');
assert.ok(css.includes('.page-home .introduction p{text-align:justify;text-justify:inter-word;hyphens:none}'),'Homepage biography must be justified');
assert.ok(!biography.includes('I work on AI systems that do research:'),
 'Old biography text should be removed');
assert.equal((research.match(/class="publication-row"/g)||[]).length,5);
assert.ok(research.includes('Modeling the Object Representations Underlying Human Physical Reasoning'));
assert.ok(career.includes('assets/tree-of-crows-1600.webp')&&!career.includes('branch-shader'),'Career must render the original-color painting without a shader');
assert.equal((career.match(/class="career-entry career-entry--/g)||[]).length,6,'Expect exactly six career entries');
assert.ok(!career.includes('class="timeline-row"'),'Old connector timeline should not be present');
assert.ok(career.includes('class="career-tree-plot"')&&career.includes('viewBox="0 0 180 920"'),'Missing duration tree geometry');
const branches=[
 ['mit','2026','present'],['harvard','2025','present'],
 ['marche','2024','2025'],['bocconi','2023','2026'],
 ['bainsa','2023','present'],['eurotech','2025','present']
];
for(const [slug,start,end] of branches){
 const entry=career.match(new RegExp('<article class="career-entry career-entry--'+slug+'[^>]*>'));
 assert.ok(entry,'Missing experience '+slug);
 assert.ok(entry[0].includes('data-start="'+start+'"')&&entry[0].includes('data-end="'+end+'"'),'Wrong duration for '+slug);
 assert.ok(career.includes('data-track="'+slug+'"'),'Missing duration line for '+slug);
 assert.ok(career.includes('data-leader="'+slug+'"'),'Missing aligned text leader for '+slug);
 assert.ok(career.includes('data-tip="'+slug+'"'),'Missing leader endpoint dot for '+slug);
}
assert.ok(css.includes('grid-template-columns:minmax(0,1fr) 180px minmax(0,1fr)'),'Desktop diagram must have its own protected column');
assert.ok(css.includes('@media(max-width:1040px)')&&css.includes('.career-tree-plot{display:none}'),'Mobile must use distinct legible layout');
assert.ok(css.includes('grid-template-rows:repeat(4,230px)'),'Chronology should be fifteen percent more compact');
assert.ok(css.includes('tree-leader-dots')&&css.includes('stroke-linecap:round'),'Rounded branches and terminal-dot connectors must be styled');
assert.ok(css.includes('.page-career .career-entry::before,.page-career .career-entry::after{content:none}'),'Desktop must not use CSS-generated dashes');
assert.ok(css.includes(':focus-within')&&css.includes('[data-tip="harvard"]'),'Mouse and keyboard focus must identify the right branch and dot');
assert.ok(!career.includes('class="tree-year-markers"'),'Avoid redundant year labels over the tree geometry');
assert.ok(css.includes('color:#62625b'),'Description contrast must remain readable');
const treeSvg=career.split('<svg viewBox="0 0 180 920"')[1]?.split('</svg>')[0]||'';
assert.equal((treeSvg.match(/data-tip="/g)||[]).length,6,'Six labeled connector endpoints required');
assert.equal((treeSvg.match(/data-track="/g)||[]).length,6,'Six duration stems required');
assert.equal((treeSvg.match(/class="tree-hitbox"/g)||[]).length,12,'Each stem and leader needs a hover hitbox');
for(const slug of branches.map(branch=>branch[0])){
  assert.equal((treeSvg.match(new RegExp('data-hit="'+slug+'"','g'))||[]).length,2,'Missing branch and leader hover targets for '+slug);
}
assert.ok(css.includes('.tree-hitbox{fill:none;stroke:transparent;stroke-width:14px;pointer-events:stroke'),'Hovered branches should have a wide invisible stroke target');
assert.ok(css.includes('stroke-width:2.9;fill:none'),'Hovered branches must become bolder without filling their enclosed space');
assert.ok(!css.includes('opacity:1;stroke:#2a2a27;fill:#2a2a27'),'The black triangle hover bug must never return');
assert.ok(css.includes('pointer-events:auto}')&&css.includes('svg{display:block;width:100%;height:100%;overflow:visible;pointer-events:none'),'Diagram must allow stroke hover targets only');
// Institution heading, then role, then date: the reference's hierarchy, preserving a full description.
for(const part of career.split('<article class="career-entry').slice(1)){
  const entry=part.split('</article>')[0];
  assert.ok(entry.indexOf('<h2>')<entry.indexOf('class="career-role"') &&
    entry.indexOf('class="career-role"')<entry.indexOf('class="career-date"'),
    'Career title, role, and date should have a consistent reading order');
}

const content=career.split('</head>')[1];
const expected=[
  'MIT','PhD student, advised by Prof. Dimitris Bertsimas','Continual learning in autonomous research systems',
  'Harvard University','Research Fellow, advised by Prof. Tomer Ullman',
  "Work at the intersection of computer vision and human cognition that led to my bachelor's thesis",
  'Marche Polytechnic','Researcher, advised by Prof. Paola Pierleoni',
  'Designed and trained light ML models for movement detection on wearables',
  'BAINSA','2023–present','Co-Founder, Chairman',
  "Italy's first student-led research labs on AI, Neuroscience, and Robotics. Active in Bocconi, Polimi, Sapienza, and more soon.",
  'EuroTech Federation','Co-Founder, Advisor','Non-profit network of European founders under 26.'
];
const careerText=content.replace(/<[^>]*>/g,'');
for(const phrase of expected)assert.ok(careerText.includes(phrase),'Missing career text: '+phrase);
const links=[
  'https://orc.mit.edu','https://www.cocodev.org','https://dii.univpm.it/riot_it/',
  'https://bainsa.ai','https://www.eurotech-federation.com'
];
for(const link of links)assert.ok(content.includes('href="'+link+'"'),'Missing clickable career link: '+link);
assert.ok(!content.includes('Research & academia')&&!content.includes('Entrepreneurship & other'));
assert.ok(js.includes('const finalSize=0.45'),'Portrait must finish at size 0.45');
assert.ok(js.includes('scale:.84'),'Smaller portrait shader scale must match photo fallback');
assert.ok(css.includes('transform:scale(.84)'),'Portrait fallback should use the same smaller scale');
assert.ok(css.includes('.site-header{justify-content:flex-end}'),'Header must right-align navigation without wordmark');
for(const asset of ['assets/profile.jpeg','assets/icon1.jpg','style.css','main.js'])
  assert.ok(existsSync(asset),asset+' missing');
assert.ok(!js.includes('transitionCoarseness')&&!js.includes('playOnceInSession'),'Halftones must not animate granularity');
for(const w of [800,1600,2400])for(const name of ['watzmann','tree-of-crows'])assert.ok(existsSync(`assets/${name}-${w}.webp`),'Missing responsive painting');
console.log('All fast page, asset, and static halftone checks passed');
