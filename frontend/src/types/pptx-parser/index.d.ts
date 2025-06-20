export {};

declare module 'pptx-parser' {
  const pptxParser: (filePath: string) => Promise<Array<{ text: string }>>;
  export = pptxParser;
}
