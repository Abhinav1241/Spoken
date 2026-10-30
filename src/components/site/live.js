export function liveProps(flash, field) {
  return {
    key: `${field}-${flash?.stamp || 0}`,
    'data-flash': flash?.fields?.[field] ? '1' : '0',
  };
}
