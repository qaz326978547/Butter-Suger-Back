function cleanUndefinedFields(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    // 只過濾掉 undefined，保留 null 和 ""
    if (value !== undefined) acc[key] = value
    return acc
  }, {})
}

module.exports = cleanUndefinedFields
