const puppeteer = require('puppeteer');
const path = require('path');
const { pathToFileURL } = require('url');

let browser, page, frame;

// store the top and tail of the js so the tests can reuse and only focus on the content of the <body> tag
const xmlHead = '<?xml  version="1.0" encoding="utf-8"?><!DOCTYPE TEI [<!ENTITY om ""><!ENTITY lac ""><!ENTITY lacorom "">]>' +
    '<?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>' +
    '<TEI xmlns="http://www.tei-c.org/ns/1.0">' +
    '<teiHeader><fileDesc><titleStmt><title/></titleStmt>' +
    '<publicationStmt><publisher/></publicationStmt>' +
    '<sourceDesc><msDesc><msIdentifier></msIdentifier></msDesc></sourceDesc>' +
    '</fileDesc></teiHeader><text><body>';
const xmlTail = '</body></text></TEI>';

const xmlHeadWithLang = '<?xml  version="1.0" encoding="utf-8"?><!DOCTYPE TEI [<!ENTITY om ""><!ENTITY lac ""><!ENTITY lacorom "">]>' +
    '<?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>' +
    '<TEI xmlns="http://www.tei-c.org/ns/1.0">' +
    '<teiHeader><fileDesc><titleStmt><title/></titleStmt>' +
    '<publicationStmt><publisher/></publicationStmt>' +
    '<sourceDesc><msDesc><msIdentifier></msIdentifier></msDesc></sourceDesc>' +
    '</fileDesc></teiHeader><text xml:lang="grc"><body>';

jest.setTimeout(5000000);

beforeAll(async () => {
    browser = await puppeteer.launch({
        // for local testing
        // headless: false,
        // slowMo: 80,
        // args: ['--window-size=1920,1080', '--disable-web-security']

        // for online testing (only ever commit these)
        headless: "new",
        slowMo: 80,
        args: ['--disable-web-security']
    });
});

afterAll(async () => {
    await browser.close();
});


describe('test getWitness with string', () => {

    beforeEach(async () => {
        let frameHandle;
        jest.setTimeout(5000000);
        page = await browser.newPage();
        await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
        await page.evaluate(`setWceEditor('wce_editor', {getWitness: 'P52'})`);
        page.waitForSelector("#wce_editor_ifr");
        frameHandle = null;
        while (frameHandle === null) {
            frameHandle = await page.$("iframe[id='wce_editor_ifr']");
        }
        frame = await frameHandle.contentFrame();

    });

    test('test with setTEI', async () => {
        const data = xmlHead + '<pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/><w>Text</w><w>here</w><lb n="P1rC1L-"/><w>and</w><w>more</w><w>text</w>' + xmlTail;
        await page.evaluate(`setTEI('${data}');`);

        // test getTEI
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<pb n="1r" type="folio" xml:id="P1r-P52"/><cb n="P1rC1-P52"/><lb n="P1rC1L-P52"/><w>Text</w><w>here</w><lb n="P1rC1L-P52"/><w>and</w><w>more</w><w>text</w>' + xmlTail);
    
        // test the get XML button (which doesn't use getTEI)
        await page.click('#mceu_19 > button');

        const menuFrameHandle = await page.$('div[id="mceu_38"] > div > div > iframe');
        const menuFrame = await menuFrameHandle.contentFrame();
        expect(await menuFrame.$eval('#html2teiOutputContainer', el => el.value)).toEqual(expect.stringContaining('<cb n="P1rC1-P52"/>'));
 
    });


});

describe('test getWitness with function', () => {

    beforeEach(async () => {
        let frameHandle;
        jest.setTimeout(5000000);
        page = await browser.newPage();
        await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
        await page.evaluate(`setWceEditor('wce_editor', {getWitness: function () { return 'P52'}})`);
        page.waitForSelector("#wce_editor_ifr");
        frameHandle = null;
        while (frameHandle === null) {
            frameHandle = await page.$("iframe[id='wce_editor_ifr']");
        }
        frame = await frameHandle.contentFrame();

    });

    test('test with setTEI', async () => {
        const data = xmlHead + '<pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/><w>Text</w><w>here</w><lb n="P1rC1L-"/><w>and</w><w>more</w><w>text</w>' + xmlTail;
        await page.evaluate(`setTEI('${data}');`);

        // test getTEI
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHead + '<pb n="1r" type="folio" xml:id="P1r-P52"/><cb n="P1rC1-P52"/><lb n="P1rC1L-P52"/><w>Text</w><w>here</w><lb n="P1rC1L-P52"/><w>and</w><w>more</w><w>text</w>' + xmlTail);

        // test the get XML button (which doesn't use getTEI)
        await page.click('#mceu_19 > button');

        const menuFrameHandle = await page.$('div[id="mceu_38"] > div > div > iframe');
        const menuFrame = await menuFrameHandle.contentFrame();
        expect(await menuFrame.$eval('#html2teiOutputContainer', el => el.value)).toEqual(expect.stringContaining('<cb n="P1rC1-P52"/>'));

    });

});

describe('test getWitnessLang with string', () => {

    beforeEach(async () => {
        let frameHandle;
        jest.setTimeout(5000000);
        page = await browser.newPage();
        await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
        await page.evaluate(`setWceEditor('wce_editor', {getWitnessLang: 'grc'})`);
        page.waitForSelector("#wce_editor_ifr");
        frameHandle = null;
        while (frameHandle === null) {
            frameHandle = await page.$("iframe[id='wce_editor_ifr']");
        }
        frame = await frameHandle.contentFrame();

    });

    test('test with setTEI', async () => {
        const data = xmlHead + '<w>Test</w>' + xmlTail;
        await page.evaluate(`setTEI('${data}');`);

        // test getTEI
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHeadWithLang + '<w>Test</w>' + xmlTail);

        // test the get XML button (which doesn't use getTEI)
        await page.click('#mceu_19 > button');

        const menuFrameHandle = await page.$('div[id="mceu_38"] > div > div > iframe');
        const menuFrame = await menuFrameHandle.contentFrame();
        expect(await menuFrame.$eval('#html2teiOutputContainer', el => el.value)).toEqual(expect.stringContaining('<text xml:lang="grc">'));

    });

});



describe('test getWitnessLang with function', () => {

    beforeEach(async () => {
        let frameHandle;
        jest.setTimeout(5000000);
        page = await browser.newPage();
        await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
        await page.evaluate(`setWceEditor('wce_editor', {getWitnessLang: function () { return 'grc'}})`);
        page.waitForSelector("#wce_editor_ifr");
        frameHandle = null;
        while (frameHandle === null) {
            frameHandle = await page.$("iframe[id='wce_editor_ifr']");
        }
        frame = await frameHandle.contentFrame();

    });

    test('test with setTEI', async () => {
        const data = xmlHead + '<w>Test</w>' + xmlTail;
        await page.evaluate(`setTEI('${data}');`);

        // test getTEI
        const xmlData = await page.evaluate(`getTEI()`);
        expect(xmlData).toBe(xmlHeadWithLang + '<w>Test</w>' + xmlTail);

        // test the get XML button (which doesn't use getTEI)
        await page.click('#mceu_19 > button');

        const menuFrameHandle = await page.$('div[id="mceu_38"] > div > div > iframe');
        const menuFrame = await menuFrameHandle.contentFrame();
        expect(await menuFrame.$eval('#html2teiOutputContainer', el => el.value)).toEqual(expect.stringContaining('<text xml:lang="grc">'));

    });
});

