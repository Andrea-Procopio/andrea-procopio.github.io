import {readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const pages=['index.html','research.html','career.html'];
for(const page of pages){
 assert.ok(existsSync(page),page+' missing');
 const html=readFileSync(page,'utf8');
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
assert.ok(research.includes('UNDER REVIEW')&&research.includes('https://arxiv.org/abs/2602.12486'));
assert.ok(!research.includes('Human-Like Coarse Object Representations in Vision Models'));
assert.ok(!research.includes('01—06 / PAPERS'));
assert.ok(research.includes('>Career <span'));
assert.ok(career.includes('assets/branch-reference.jpg'));
assert.ok(!career.includes('id="botanical-tree"'));
assert.equal((career.match(/class="timeline-branch academic"/g)||[]).length,4);
assert.equal((career.match(/class="timeline-branch enterprise"/g)||[]).length,4);
for(const name of ['Bocconi University','RIOT Lab','Harvard University','MIT Operations Research Center','BAINSA','EuroTech Federation'])
 assert.ok(career.includes(name),'Missing career entry '+name);
assert.ok(js.includes('size:0.14,radius:1.05,contrast:0.5'),'Incorrect shader parameters');
for(const asset of ['assets/profile.jpeg','assets/icon1.jpg','assets/branch-reference.jpg','style.css','main.js'])
 assert.ok(existsSync(asset),asset+' missing');
console.log('V3.1 content, site structure, and asset checks passed');
