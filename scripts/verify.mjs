import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const pages=['index.html','research.html','career.html'];
for(const page of pages){
 assert.ok(existsSync(page),page+' missing');
 const html=readFileSync(page,'utf8');
 const embedded=html.match(/<style id="embedded-site-styles">([\s\S]*?)<\/style>/);
 assert.ok(embedded, page+' must include inline CSS fallback');
 assert.ok(embedded[1].includes('.page-width')&&embedded[1].includes('.portrait-graphic'),page+' missing layout CSS');
 assert.ok(html.includes('style.css?v=20261018-portrait-v1'),page+' missing cache-busted stylesheet');
 assert.ok(html.includes('main.js?v=20261018-portrait-v1'),page+' missing versioned script');
 assert.equal(embedded[1].trim(),readFileSync('style.css','utf8').trim(),page+' inline and linked styles must match');
 assert.ok(html.includes('style.css')&&html.includes('main.js'),page+' missing shared assets');
 for(const route of ['research.html','career.html'])assert.ok(html.includes(route),page+' missing navigation');
 assert.equal(html.split('<h1 ').length-1,1,page+' needs one heading');
}
const home=readFileSync('index.html','utf8');
const research=readFileSync('research.html','utf8');
const career=readFileSync('career.html','utf8');
const js=readFileSync('main.js','utf8');
assert.ok(home.includes('assets/profile.jpeg')&&home.includes('id="contact"'));
for(const phrase of ['RESEARCH / SCIENTIFIC DISCOVERY','Researcher <span>','CORRESPONDENCE / 02'])
 assert.ok(!home.includes(phrase),'Unwanted home text: '+phrase);
assert.equal((research.match(/class="publication-row"/g)||[]).length,5);
assert.ok(research.toLowerCase().includes('under review')&&research.includes('https://arxiv.org/abs/2602.12486'));
assert.ok(!research.includes('Human-Like Coarse Object Representations in Vision Models'));
assert.ok(!research.includes('01—06 / PAPERS'));
assert.ok(research.includes('>Career <span'));
assert.ok(career.includes('assets/branch-reference.jpg'));
assert.ok(!career.includes('id="botanical-tree"'));
assert.equal((career.match(/class="timeline-branch academic"/g)||[]).length,4);
assert.equal((career.match(/class="timeline-branch enterprise"/g)||[]).length,4);
for(const name of ['Bocconi University','Marche Polytechnic','Harvard University','MIT Operations Research Center','BAINSA','EuroTech Federation'])
 assert.ok(career.includes(name),'Missing career entry '+name);
assert.ok(js.includes('size:0.14,radius:1.05,contrast:0.5'),'Incorrect shader parameters');
for(const asset of ['assets/profile.jpeg','assets/icon1.jpg','assets/branch-reference.jpg','style.css','main.js'])
 assert.ok(existsSync(asset),asset+' missing');
const careerBody=career.split('</head>')[1]||'';
assert.ok(!careerBody.includes('Research & academia')&&!careerBody.includes('Entrepreneurship & other'),'Career column labels should be removed');
for(const phrase of ['MIT — PhD student','Advised by Prof. Dimitris Bertsimas','Harvard University — Research Fellow',
 'Advised by Prof. Tomer Ullman','Marche Polytechnic — Research Intern',
 'Advised by Prof. Paola Pierleoni','2024–2025','Co-Founder and Advisor','Co-Founder, President','2024–2026'])
 assert.ok(careerBody.includes(phrase),'Missing updated career copy: '+phrase);
assert.ok(js.includes('INTRO_DURATION_MS=6000'),'Missing six-second introduction');
assert.ok(js.includes('window.localStorage.getItem(INTRO_KEY)'),'Intro must be limited to first visit');
assert.ok(js.includes('reduced')&&js.includes('START_SIZE=1.0')&&js.includes('TARGET_SIZE=0.55'));
console.log('Career, assets, embedded styles, and first-visit animation checks passed');
