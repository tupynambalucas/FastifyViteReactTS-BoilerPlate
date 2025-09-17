declare module '@fastify/vite/utils' {
  /**
   * Creates a template function from an HTML source string.
   * @param source The raw HTML string.
   * @returns A promise that resolves to a function, which can take a data payload and returns the final HTML string.
   */
  export function createHtmlTemplateFunction(source: string): Promise<(payload?: Record<string, unknown>) => string>;
}

declare module '@fastify/vite/plugin';


declare module '@tupynamba/fastifyreact-ts/plugin';