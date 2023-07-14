import { error, json } from '@sveltejs/kit';
import puppeteer from 'puppeteer';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  const { html } = await request.json();
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html);

  const content = await page.$('body');
  console.log(html);
  const imageBuffer = await content.screenshot({ omitBackground: true });

  await page.close();
  await browser.close();

  return json({ image: `data:image/png;base64,${imageBuffer.toString('base64')}` });
}
