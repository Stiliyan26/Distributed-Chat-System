export function isMarkdownFencedCode(content: string): boolean {
  return content.startsWith('```') && content.endsWith('```');
}

export function parseMarkdownFencedCode(content: string): { lang: string; code: string } {
  const lang = content.slice(3, content.indexOf('\n')) ?? 'bash'; //first ``` removed
  const code = content.slice(content.indexOf('\n') + 1, -3); // last ``` removed

  return { lang, code };
}
