const { dataSource } = require('../../db/data-source')

//新增評價 
async function updateTeacherRating(courseId){
    //查找課程對應老師
    const courseRepo = dataSource.getRepository('courses');
    const course = await courseRepo.findOne({
      where: { id: courseId },
      select: ['teacher_id']
    });
    if (!course || !course.teacher_id) return;
  
    const teacherId = course.teacher_id;

    //重新計算老師所有課程的平均評分
    const ratingRepo = dataSource.getRepository('ratings');
    const avgResult = await ratingRepo.createQueryBuilder('rating')
      .leftJoin('rating.courses', 'course')
      .where('course.teacher_id = :teacherId', { teacherId })
      .select('ROUND(AVG(rating.rating_score)::numeric, 2)', 'avg_rating_score')
      .getRawOne();
  
    const avgRatingScore = avgResult.avg_rating_score || 0;

    //更新教師評價
    const teacherRepo = dataSource.getRepository('teacher');
    await teacherRepo.update(teacherId, { rating_score: avgRatingScore });
}

module.exports = updateTeacherRating
