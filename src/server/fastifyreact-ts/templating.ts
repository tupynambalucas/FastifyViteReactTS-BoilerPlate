import { createHtmlTemplateFunction } from '@fastify/vite/utils'
import { HTMLRewriter, Element } from 'html-rewriter-wasm'

// Define a type for the template functions returned by createHtmlTemplateFunction.
// It's a function that optionally takes a payload and returns a string.
type TemplateFunction = (payload?: Record<string, unknown>) => string;

// Define an interface for the object containing the before/after template pair.
interface TemplatePair {
  beforeElement: TemplateFunction;
  afterElement: TemplateFunction;
}

// Define an interface for the final return object of createHtmlTemplates.
interface HtmlTemplates {
  universal: TemplatePair;
  serverOnly: TemplatePair;
}

// Define a generic type for the config object.
// You can make this more specific if you know its structure.
type AppConfig = Record<string, any>;

/**
 * Creates two sets of HTML template functions from a source string.
 * One set is "universal" (for client & server) and the other is "serverOnly"
 * (with client-side module scripts removed).
 * @param source The raw HTML source string.
 * @param config The application configuration object.
 * @returns An object with universal and serverOnly template pairs.
 */
export async function createHtmlTemplates(source: string, config: AppConfig): Promise<HtmlTemplates> {
  // A placeholder comment in the HTML to split the content.
  const el = '<!-- element -->'

  const universalParts = source.split(el)
  const serverOnlyRaw = await removeClientModule(source, config)
  const serverOnlyParts = serverOnlyRaw.split(el)

  var result = {
    // Templates for client-only and universal rendering
    universal: {
      beforeElement: await createHtmlTemplateFunction(universalParts[0]),
      afterElement: await createHtmlTemplateFunction(universalParts[1]),
    },
    // Templates for server-only rendering
    serverOnly: {
      beforeElement: await createHtmlTemplateFunction(serverOnlyParts[0]),
      afterElement: await createHtmlTemplateFunction(serverOnlyParts[1]),
    },
  }

  return result
}

/**
 * Removes script tags with type="module" from an HTML string.
 * This is used to create a server-only version of the template.
 * @param html The HTML string to process.
 * @param config The application configuration object (unused in this function but kept for consistency).
 * @returns A promise that resolves to the modified HTML string.
 */
async function removeClientModule (html: string, config: AppConfig): Promise<string> {
  const decoder = new TextDecoder()

  let output = ''
  // Initialize the HTMLRewriter, which streams and modifies HTML.
  const rewriter = new HTMLRewriter((outputChunk: Uint8Array) => {
    output += decoder.decode(outputChunk)
  })

  // Set up a handler for all <script> tags.
  rewriter.on('script', {
    element (element: Element) {
      // Directly check if the 'type' attribute is 'module'.
      // This is more efficient and avoids iterator issues.
      if (element.getAttribute('type') === 'module') {
        element.replace('')
      }
    },
  })

  try {
    // Process the HTML through the rewriter.
    const encoder = new TextEncoder()
    await rewriter.write(encoder.encode(html))
    await rewriter.end()
    return output
  } finally {
    // Free up the WebAssembly memory used by the rewriter.
    rewriter.free()
  }
}