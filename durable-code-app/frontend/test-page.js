/**
 * Purpose: Puppeteer test script for automated page testing and console output capture
 * Scope: Browser automation testing utilities for the frontend application
 * Overview: This script provides automated browser testing capabilities using Puppeteer
 *     to launch a headless browser, navigate to pages, capture console output, and perform
 *     basic interaction testing. It's designed for development testing and debugging,
 *     allowing developers to test page functionality without manual browser interaction.
 *     The script includes console message forwarding for debugging purposes.
 * Dependencies: Puppeteer for browser automation and headless Chrome control
 * Exports: No exports - this is a standalone test execution script
 * Props/Interfaces: No interfaces - uses Puppeteer API directly
 * Implementation: Async/await pattern with headless browser launch and page navigation
 */

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

    // Wait a bit for React to render
    await page.waitForTimeout(2000);

    // Get the content of the root div
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML : 'Root not found';
    });

    console.log('Root div content:', rootContent);

    // Get full page HTML
    const html = await page.content();
    console.log('Full HTML length:', html.length);

    // Check if there's actual content
    if (rootContent && rootContent.trim() !== '') {
      console.log('✅ Page rendered successfully!');
    } else {
      console.log('❌ Page is blank - no content in root div');
    }

  } catch (error) {
    console.error('Error:', error);
  }

  await browser.close();
})();
