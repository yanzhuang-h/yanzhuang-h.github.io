export function transformOutsideCode(text, transform) {
  let fence = null;
  return text.split(/(?<=\n)/).map(line => {
    const match = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (match) {
      if (!fence) fence = match[1];
      else if (match[1][0] === fence[0] && match[1].length >= fence.length) fence = null;
      return line;
    }
    if (fence || /^(?:\t| {4})/.test(line)) return line;
    return line.split(/(`+[^`]*`+)/g).map((part, i) => i % 2 ? part : transform(part)).join('');
  }).join('');
}
