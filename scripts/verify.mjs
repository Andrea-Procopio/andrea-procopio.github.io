import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const pages=['index.html','research.html','career.html'];
for(const page of pages){assert.ok(existsSync(page),page+' missing');const html=readFileSync(page,'utf8');assert.ok(html.includes('style.css')&&html.includes('main.js'),page+' missing shared assets');for(const route of ['research.html','career.html'])assert.ok(html.includes(route),page+' missing navigation');assert.equal((html.match(/<h1\b/g)||[]).length,1,page+' needs one h1')}
const home=readFileSync('index.html','utf8'),research=readFileSync('research.html','utf8'),career=readFileSync('career.html','utf8'),js=readFileSync('main.js','utf8');
assert.ok(home.includes('assets/profile.jpeg')&&home.includes('id="contact"'));
assert.ok(!home.includes('class="publication-row"'),'Home is not an archive');
assert.ok(research.includes('Under review')||research.includes('UNDER REVIEW'));
assert.ok(research.indexOf('Modeling the Object Representations')<research.indexOf('Human-Like Coarse Object'));
assert.equal((research.match(/class="publication-row"/g)||[]).length,5);
assert.equal((career.match(/class="trajectory-entry"/g)||[]).length,5);
assert.ok(career.includes('id="botanical-tree"')&&js.includes('function botanical('));
for(const asset of ['assets/profile.jpeg','assets/icon1.jpg','style.css','main.js'])assert.ok(existsSync(asset),asset+' missing');
console.log('V3 route, content, and static checks passed');
