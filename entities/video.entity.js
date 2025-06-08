// // Sequelize 範例
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
// entities/video.entity.js
// module.exports = (sequelize, DataTypes) => {
//   const Video = sequelize.define('Video', {
//     id: {
//       type: DataTypes.UUID,
//       defaultValue: DataTypes.UUIDV4,
//       primaryKey: true
//     },
//     courseId: {
//       type: DataTypes.INTEGER,
//       allowNull: false
//     },
//     sectionId: {
//       type: DataTypes.INTEGER,
//       allowNull: false
//     },
//     key: {
//       type: DataTypes.STRING
//     },
//     url: {
//       type: DataTypes.STRING
//     },
//     originalName: {
//       type: DataTypes.STRING
//     }
//   }, {
//     tableName: 'videos',
//   });

//   return Video;
// };
