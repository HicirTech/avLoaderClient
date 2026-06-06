import { metadataTagMap } from "./elementMapper.ts";

type MetadataValue = string[] | string;
type MetadataRecord = Record<string, MetadataValue>;

const keyAliases: Record<string, string[]> = {
  番號: ["番號", "ID", "番号"],
  原标题: ["原标题", "Original Title"],
  翻译标题: ["翻译标题", "Translated Title", "Title"],
  日期: ["日期", "Released Date", "Release Date"],
  片商: ["片商", "Maker", "Studio"],
  類別: ["類別", "Tags", "Genre", "类别"],
  评分: ["评分", "Rating"],
  演員: ["演員", "Actor(s)", "Actors", "演员"],
  导演: ["导演", "Director"],
};

const normalizeValues = (value: MetadataValue | undefined): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }

  return [String(value ?? "").trim()].filter(Boolean);
};

const firstValue = (value: MetadataValue | undefined): string => {
  return normalizeValues(value)[0] ?? "";
};

const findAliasValue = (
  canonicalKey: string,
  metadata: MetadataRecord,
): MetadataValue | undefined => {
  const alias = keyAliases[canonicalKey]?.find((candidate) =>
    Object.prototype.hasOwnProperty.call(metadata, candidate)
  );

  return alias ? metadata[alias] : undefined;
};

const normalizeMetadata = (metadata: MetadataRecord): MetadataRecord => {
  const normalizedMetadata = { ...metadata };

  const allCanonicalKeys = [
    ...new Set(["番號", ...Object.keys(metadataTagMap)]),
  ];

  for (const canonicalKey of allCanonicalKeys) {
    if (Object.prototype.hasOwnProperty.call(metadata, canonicalKey)) {
      normalizedMetadata[canonicalKey] = metadata[canonicalKey];
      continue;
    }

    const aliasValue = findAliasValue(canonicalKey, metadata);
    if (aliasValue !== undefined) {
      normalizedMetadata[canonicalKey] = aliasValue;
    }
  }

  if (!normalizeValues(normalizedMetadata["翻译标题"]).length) {
    const originalTitle = normalizedMetadata["原标题"];
    if (normalizeValues(originalTitle).length) {
      normalizedMetadata["翻译标题"] = originalTitle;
    }
  }

  return normalizedMetadata;
};

const renderSimpleTag = (key: string, metadata: MetadataRecord): string[] => {
  const value = firstValue(metadata[key]);
  if (!value) {
    return [];
  }

  return [`<${metadataTagMap[key]}>${value}</${metadataTagMap[key]}>`];
};

const renderTitleTag = (key: string, metadata: MetadataRecord): string[] => {
  const title = firstValue(metadata[key]);
  const titleId = firstValue(metadata["番號"]);

  if (!title) {
    return [];
  }

  return [
    `<${metadataTagMap[key]}>[${titleId}]${title}</${metadataTagMap[key]}>`,
  ];
};

const renderListTag = (key: string, metadata: MetadataRecord): string[] => {
  return normalizeValues(metadata[key]).map((item) =>
    `<${metadataTagMap[key]}>${item}</${metadataTagMap[key]}>`
  );
};

const renderActors = (key: string, metadata: MetadataRecord): string[] => {
  return normalizeValues(metadata[key]).map((item) =>
    `<actor><name>${item}</name><role></role><order></order></actor>`
  );
};

const renderField = (key: string, metadata: MetadataRecord): string[] => {
  if (!normalizeValues(metadata[key]).length) {
    return [];
  }

  const rendererMap: Record<
    string,
    (field: string, data: MetadataRecord) => string[]
  > = {
    原标题: renderTitleTag,
    翻译标题: renderTitleTag,
    日期: renderSimpleTag,
    片商: renderSimpleTag,
    類別: renderListTag,
    评分: renderSimpleTag,
    演員: renderActors,
    导演: renderSimpleTag,
  };

  return rendererMap[key]?.(key, metadata) ?? [];
};

export const convertToNfo = (metadata: MetadataRecord): string => {
  const normalizedMetadata = normalizeMetadata(metadata);

  return Object.keys(metadataTagMap)
    .flatMap((key) => renderField(key, normalizedMetadata))
    .join("\n");
};
