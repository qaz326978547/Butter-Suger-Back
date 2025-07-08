# Butter & Sugar 烘焙課程影音平台

## 啟動方式

1. 安裝相依套件

```
npm ci
```

2. 設定環境變數

使用 Docker 開發：

```
POSTGRES_USER=testHexschool
POSTGRES_PASSWORD=pgStartkit4test
POSTGRES_DB=test
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=testHexschool
DB_PASSWORD=pgStartkit4test
DB_DATABASE=test
DB_SYNCHRONIZE=true
DB_ENABLE_SSL=false
PORT=8080
LOG_LEVEL=debug
JWT_EXPIRES_DAY=30d
JWT_SECRET=hexschool666
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
FRONTEND_URL=
SESSION_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_CLOUDFRONT_URL=
AWS_S3_BUCKET_NAME=
MerchantID=
HashKEY=
HashIV=
Version=
ReturnUrl=
NotifyUrl=
PayGateWay=
```

使用 localhost 開發伺服器（資料庫仍使用 Docker）：

```
POSTGRES_USER=testHexschool
POSTGRES_PASSWORD=pgStartkit4test
POSTGRES_DB=test
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=testHexschool
DB_PASSWORD=pgStartkit4test
DB_DATABASE=test
DB_SYNCHRONIZE=true
DB_ENABLE_SSL=false
PORT=8080
LOG_LEVEL=debug
JWT_EXPIRES_DAY=30d
JWT_SECRET=hexschool666
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=
FRONTEND_URL=
SESSION_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_CLOUDFRONT_URL=
AWS_S3_BUCKET_NAME=
MerchantID=
HashKEY=
HashIV=
Version=
ReturnUrl=
NotifyUrl=
PayGateWay=
```

## 開發指令

- `npm run dev` - 啟動開發伺服器
- `npm run start` - 正式端啟動伺服器與資料庫
- `npm run start:prod` - 本地端啟動伺服器與資料庫
- `npm run restart` - 重新啟動伺服器與資料庫
- `npm run stop` - 關閉啟動伺服器與資料庫
- `npm run clean` - 關閉伺服器與資料庫並清除所有資料
- `npm run db:truncate ` - 清空所有資料表資料
- `npm run db:drop ` - 刪除所有資料表

## 開發建立環境順序

- `npm i`
- `.env 載入環境變數`
- `npm run start:prod`
- `npm run dev`

### 前端前台網址

- `https://buttersuger-frontend.zeabur.app/Home`

### 前端後台網址

- `https://buttersugar-frontend.zeabur.app/Teacher/`

### swagger 文件

- `https://buttersugar.zeabur.app/api-docs/`

### 前端專案

- `https://github.com/HatchiX8/Butter-Sugar-Frontend`

### 後端專案

- `https://github.com/qaz326978547/Butter-Suger-Back`

### 環境
- `Zeabur`

### 使用技術
- `Docker & Docker Compose`
- `Node.js 21.x + Express`
- `TypeORM + PostgreSQL`
- `Joi schema validation`
- `藍新金流整合`
- `ezpay 跨境支付(微信、支付寶等)`
- `Amazon S3`
- `AWS CloudFront CDN`
- `Google 第三方登入`
- `Swagger`

### API 文件
#### User
- `GET /api/v1/users/auth/google` google 第三方登入
- `GET /api/v1/users/info` google 取得使用者資料
- `GET /api/v1/users/check` 驗證使用者是否登入
- `PATCH /api/v1/users/update` 更新使用者資料
- `GET /api/v1/course/favorites/list` 取得收藏課程列表
- `POST /api/v1/course/favorites` 新增收藏課程
- `DELETE /api/v1/course/favorites/{favoriteId}` 刪除收藏課程
- `GET /api/v1/users/orders` 取得所有訂單
- `GET /api/v1/users/orders/{orderNumber}` 取得單一訂單

#### Teacher
- `GET /api/v1/teacher/profile` 取得教師資料
- `PATCH /api/v1/teacher/profile` 更新教師資料
- `GET /api/v1/teacher/featured` 取得精選教師資料
- `GET /api/v1/teacher/{teacherId}` 取得單一精選教師
- `GET /api/v1/teacher/teacherCourse` 取得教師開設的課程列表
- `GET /api/v1/teacher-applications` 取得教師審核資料（個人）
- `POST /api/v1/teacher-applications` 申請成為教師
- `PATCH /api/v1/teacher-applications/{applicationId}` 修改教師審核資料
- `PATCH /api/v1/course/{courseId}/status` 更改課程狀態
- `GET /api/v1/teacher/revenue` 取得教師收益表

#### Admin
- `GET /api/v1/admin/teacher-applications` 取得所有教師申請資料
- `GET /api/v1/admin/teacher-applications/{applicationId}` 取得單一教師申請資料
- `PATCH /api/v1/admin/teacher-applications/{applicationId}/status` 審核教師申請
- `GET /api/v1/admin/system-log` 取得系統日誌(目前只紀錄登入後的動作)

#### My-Courses
- `GET /api/v1/course/my-courses` 取得我的課程列表
- `POST /api/v1/course/subsections/{subsectionId}/progress` 新增章節進度
- `PATCH /api/v1/course/subsections/{subsectionId}/progress` 標記章節進度

#### Courses
- `GET /api/v1/course/popular` 取得首頁熱門課程資料
- `GET /api/v1/course/list` 取得所有課程
- `GET /api/v1/course/category` 取得課程分類列表
- `POST /api/v1/course/{courseId}/ratings` 新增評價
- `PATCH /api/v1/course/{courseId}/ratings` 更新課程評價
- `GET /api/v1/course/{courseId}` 取得單一課程資料
- `POST /api/v1/course/create/title` 新增課程標題
- `POST /api/v1/course/{courseId}/category` 新增課程類別
- `POST /api/v1/course/{courseId}/upload/course-banner-image` 新增 banner 圖片
- `DELETE /api/v1/course/{courseId}/upload/course-banner-image` 刪除 banner 圖片
- `POST /api/v1/course/{courseId}/upload/small-image` 新增課程封面小圖
- `DELETE /api/v1/course/{courseId}/upload/small-image` 刪除課程封面小圖
- `POST /api/v1/course/{courseId}/upload/course-handouts` 新增課程講義
- `DELETE /api/v1/course/{courseId}/upload/course-handouts` 刪除課程講義
- `GET /api/v1/course/{courseId}/handouts` 取得課程講義
- `POST /api/v1/course/{courseId}/upload/course-trailer` 新增課程預告片
- `DELETE /api/v1/course/{courseId}/upload/course-trailer` 刪除課程預告片
- `POST /api/v1/course/{courseId}/upload/description-image` 新增課程描述圖片
- `DELETE /api/v1/course/{courseId}/upload/description-image` 刪除課程描述圖片
- `POST /api/v1/course/{courseId}/save` 儲存課程內容資訊
- `PATCH /api/v1/course/{courseId}/price` 新增修改課程價格
- `GET /api/v1/course/ratings` 取得所有課程評價
- `POST /api/v1/course/{courseId}/questions` 提出課程問題
- `GET /api/v1/course/{courseId}/questions` 取得課程問題列表
- `POST /api/v1/course/{courseId}/answers` 提出課程回答

#### Section
- `GET /api/v1/course/{courseId}/section` 取得課程章節
- `POST /api/v1/course/{courseId}/section` 新增課程章節
- `PATCH /api/v1/course/section/{sectionId}` 修改課程章節
- `DELETE /api/v1/course/section/{sectionId}` 刪除課程章節

#### Subsection
- `GET /api/v1/course/section/{sectionId}/subsection` 取得特定章節小節
- `POST /api/v1/course/section/{sectionId}/subsection` 新增小節
- `PATCH /api/v1/course/{courseId}/subsection` 批次修改章節小節
- `POST /api/v1/subsection/upload/{subsectionId}/upload-video` 上傳小節影片
- `DELETE /api/v1/subsection/upload/{subsectionId}/upload-video` 刪除小節影片
- `DELETE /api/v1/course/subsection/{subsectionId}` 刪除小節(包括影片)

#### Cart
- `GET /api/v1/cart` 取得購物車內容
- `POST /api/v1/cart` 加入課程到購物車
- `POST /api/v1/cart/merge` 登入後整合購物車
- `POST /api/v1/cart/checkout` 結帳(請使用網頁執行結帳，因會跳轉頁面)
- `DELETE /api/v1/cart/{cartItemId}` 刪除購物車中的課程
- `GET /api/v1/course/purchased` 取得已購買的課程列表







