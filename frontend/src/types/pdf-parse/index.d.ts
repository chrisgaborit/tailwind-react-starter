export {};

declare module 'pdf-parse' {
  const pdfParse: (buffer: Buffer) => Promise<{ text: string }>;
  export = pdfParse;
}
