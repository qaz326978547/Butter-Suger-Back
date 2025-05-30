// Sequelize 範例
module.exports = (sequelize, DataTypes) => {
  const Video = sequelize.define('Video', {
    courseId:     DataTypes.INTEGER,
    sectionId:    DataTypes.INTEGER,
    key:          DataTypes.STRING,
    url:          DataTypes.STRING,
    originalName: DataTypes.STRING
  }, {});
  return Video;
};
