const { dataSource } = require('../data-source')

async function seedCourseCategories() {
  const repo = dataSource.getRepository('course_categories')
  const names = ['all', 'bread', 'cookie', 'cake']
  for (const name of names) {
    const exist = await repo.findOne({ where: { name } })
    if (!exist) {
      await repo.save({ name })
    }
  }
}

module.exports = seedCourseCategories
