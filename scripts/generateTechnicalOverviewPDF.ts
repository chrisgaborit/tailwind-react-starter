// Script to generate PDF from HTML technical overview
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function generatePDF() {
  const htmlPath = path.resolve(__dirname, '../TECHNICAL_OVERVIEW_CTO.html');
  const pdfPath = path.resolve(__dirname, '../TECHNICAL_OVERVIEW_CTO.pdf');

  if (!fs.existsSync(htmlPath)) {
    console.error('HTML file not found:', htmlPath);
    process.exit(1);
  }

  console.log('🚀 Starting PDF generation...');
  console.log('   HTML:', htmlPath);
  console.log('   Output:', pdfPath);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    // Load HTML file
    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle0',
    });

    // Generate PDF
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm',
      },
      printBackground: true,
      preferCSSPageSize: true,
    });

    console.log('✅ PDF generated successfully!');
    console.log('   Location:', pdfPath);
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

generatePDF();



