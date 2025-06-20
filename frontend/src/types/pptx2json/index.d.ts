export {};

declare module 'pptx2json' {
  export default class Pptx2Json {
    load(filePath: string): Promise<Array<any>>;
  }
}
