
# 先依user資料驗證為例 以下為驗證流程

## - 1. 在schema建立 user.schema.js 
依照現有的user.schema的joi格式去建立,包含錯誤訊息
須注意的是如果欄位接受null或空字串 可使用allow(null, '')
加上allow(null, '') 是為了防止前端傳送空字串被joi驗證檔下

## - 2. 完成建立後會與middleware/validateSchema.middleware.js去搭配 載入要驗證的路由進行驗證

以user.route.js的編輯學生資料為例

* ...handleMiddleware([]) 用意單純是 我覺得比較簡潔一點,把前面包含所有要載入的middleware後最後一個參數為controller,
  這邊的controller已經有包含了handleErrorAsync(controller) 的共用try catch的方式所以直接放controller就好

- const isAuth = require('../middleware/isAuth.middleware')  驗證是否為使用者 是否登入
- const validateSchema = require('../middleware/validateSchema.middleware') 驗證joi套件middleware
- const { updateUserSchema } = require('../schema/user.schema') schema驗證格式引入
- const handleMiddleware = require('../utils/handleMiddleware') 通用middleware封包

router.patch(
  '/update',
  ...handleMiddleware([isAuth, validateSchema(updateUserSchema), userController.updateUserData])
)