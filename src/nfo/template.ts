export interface NfoTemplateConfig {
  version: string;
  encoding: string;
  standalone: "yes" | "no";
  rootTag: string;
}

export const DEFAULT_NFO_TEMPLATE: NfoTemplateConfig = {
  version: "1.0",
  encoding: "UTF-8",
  standalone: "yes",
  rootTag: "movie",
};

export const renderNfoDocument = (
  entries: string[],
  template: NfoTemplateConfig = DEFAULT_NFO_TEMPLATE,
): string => {
  const body = entries.filter(Boolean).join("\n");

  return [
    `<?xml version="${template.version}" encoding="${template.encoding}" standalone="${template.standalone}"?>`,
    "",
    `<${template.rootTag}>`,
    body,
    `</${template.rootTag}>`,
  ].join("\n");
};
