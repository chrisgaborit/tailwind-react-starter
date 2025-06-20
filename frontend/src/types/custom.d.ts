declare module 'pdf-parse' {
  const pdfParse: (buffer: Buffer) => Promise<{ text: string }>;
  export = pdfParse;
}

declare module 'pptx-parser' {
  const pptxParser: (filePath: string) => Promise<Array<{ text: string }>>;
  export = pptxParser;
}
