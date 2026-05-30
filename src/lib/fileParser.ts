import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    text += strings.join(' ') + '\n';
  }
  return text;
}

async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractXlsxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  let text = '';
  
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv) {
      text += `\n--- Sheet: ${sheetName} ---\n${csv}`;
    }
  });
  
  return text;
}

async function extractPptxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  let text = '';
  
  // Find all slide xml files
  const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'));
  
  // Sort naturally
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10);
    const numB = parseInt(b.replace(/\D/g, ''), 10);
    return numA - numB;
  });

  for (const [index, filename] of slideFiles.entries()) {
    const slideXml = await zip.files[filename].async('string');
    // Extract text from <a:t> tags
    const matches = slideXml.match(/<a:t>([\s\S]*?)<\/a:t>/g);
    if (matches) {
      const slideText = matches.map(m => m.replace(/<\/?a:t>/g, '').trim()).filter(t => t.length > 0).join(' ');
      text += `\n--- Slide ${index + 1} ---\n${slideText}\n`;
    }
  }

  return text;
}

export async function parseFileToText(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return await extractPdfText(file);
    case 'docx':
      return await extractDocxText(file);
    case 'xlsx':
    case 'csv':
      return await extractXlsxText(file);
    case 'pptx':
      return await extractPptxText(file);
    case 'txt':
    case 'md':
    case 'json':
      return await file.text();
    case 'doc':
    case 'xls':
    case 'ppt':
      throw new Error(`Định dạng .${extension} (chuẩn cũ) không được hỗ trợ. Vui lòng Save As sang chuẩn mới (.docx, .xlsx, .pptx)`);
    default:
      throw new Error(`Định dạng .${extension} không được hỗ trợ.`);
  }
}
