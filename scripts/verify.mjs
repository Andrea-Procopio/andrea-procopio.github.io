import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const pages=['index.html','research.html','career.html'];
const css=readFileSync('style.css','utf8');
for(const page of pages){
  const html=readFileSync(page,'utf8');
  const embedded=html.match(/<style id="embedded-site-styles">([\s\S]*?)<\/style>/);
  assert.ok(embedded,page+' missing inline style fallback');
  assert.equal(embedded[1].trim(),css.trim(),page+' styles differ from style.css');
  assert.ok(html.includes('style.css?v=20261018-career-v2'),page+' CSS version mismatch');
  assert.ok(html.includes('main.js?v=20261018-session-v1'),page+' script version mismatch');
  assert.ok(html.includes('research.html')&&html.includes('career.html'),page+' missing navigation');
  assert.equal(html.split('<h1 ').length-1,1,page+' needs exactly one h1');
}
const home=readFileSync('index.html','utf8');
const research=readFileSync('research.html','utf8');
const career=readFileSync('career.html','utf8');
const js=readFileSync('main.js','utf8');
assert.ok(home.includes('assets/profile.jpeg')&&home.includes('id="contact"'));
assert.equal((research.match(/class="publication-row"/g)||[]).length,5);
assert.ok(research.includes('Modeling the Object Representations Underlying Human Physical Reasoning'));
assert.ok(career.includes('assets/branch-reference.jpg'));
assert.equal((career.match(/class="timeline-branch academic"/g)||[]).length,4);
assert.equal((career.match(/class="timeline-branch enterprise"/g)||[]).length,4);
const content=career.split('</head>')[1];
const expected=[
  'MIT','PhD student, advised by Prof. Dimitris Bertsimas','Continual learning in autonomous research systems',
  'Harvard University','Research Fellow, advised by Prof. Tomer Ullman',
  "Work at the intersection of computer vision and human cognition that led to my bachelor's thesis",
  'Marche Polytechnic University','Researcher, advised by Prof. Paola Pierleoni',
  'Designed and trained light ML models for movement detection on wearables',
  'BAINSA','2023–present','Co-Founder, Chairman',
  "Italy's first student-led research labs on AI, Neuroscience, and Robotics. Active in Bocconi, Polimi, Sapienza, and more soon.",
  'EuroTech Federation','Co-Founder, Advisor','Non-profit network of the brightest European founders U26.'
];
for(const phrase of expected)assert.ok(content.includes(phrase),'Missing career text: '+phrase);
const links=[
  'https://orc.mit.edu','https://www.cocodev.org','https://dii.univpm.it/riot_it/',
  'https://bainsa.ai','https://www.eurotech-federation.com'
];
for(const link of links)assert.ok(content.includes('href="'+link+'"'),'Missing clickable career link: '+link);
assert.ok(!content.includes('Research & academia')&&!content.includes('Entrepreneurship & other'));
assert.ok(js.includes('TRANSITION_MS=3500'),'Animations must take 3.5 seconds');
assert.ok(js.includes('const finalSize=0.5'),'Portrait must finish at size 0.5');
assert.ok(js.includes('const finalSize=0.2'),'Tree must finish at size 0.2');
assert.ok(js.includes('sessionStorage.getItem')&&js.includes('sessionStorage.setItem'),'Must run once per tab session');
assert.ok(js.includes('andrea-halftone-portrait-session-v1')&&js.includes('andrea-halftone-tree-session-v1'),'Each page needs independent state');
assert.ok(js.includes('if(reduced)'),'Reduced motion must skip animation');
for(const asset of ['assets/profile.jpeg','assets/icon1.jpg','assets/branch-reference.jpg','style.css','main.js'])
  assert.ok(existsSync(asset),asset+' missing');
console.log('All fast career, asset, and session animation checks passed');
