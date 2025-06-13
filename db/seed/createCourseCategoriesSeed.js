const { dataSource } = require('../data-source')

async function seedCourseCategories() {
  const repo = dataSource.getRepository('course_categories')
  const names = ['all', 'bread', 'cookie', 'cake']
  console.log('Seeding course categories...')
  for (const name of names) {
    const exist = await repo.findOne({ where: { name } })
    if (!exist) {
      await repo.save({ name })
      console.log(`Created course category: ${name}`)
    } else {
      console.log(`Course category already exists: ${name}`)
    }
  }
}

module.exports = seedCourseCategories
