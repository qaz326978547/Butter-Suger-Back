const { dataSource } = require('../db/data-source')
const { appError, sendResponse } = require('../utils/responseFormat')
const wrapAsync = require('../utils/wrapAsync')
const cleanUndefinedFields = require('../utils/cleanUndefinedFields')
const getCartItemDetails = require('../services/cart/cartItemDetails')
const summaryCartItems = require('../services/cart/summaryCartItems')
const renderOrderHtml = require('../services/cart/renderOrderHtml')
const { createAesEncrypt, createShaEncrypt, createAesDecrypt } = require('../services/checkout/checkout')
const { In } = require('typeorm')
const escapeHtml = require('he')  //防止 html 注入攻擊，最後再補上
const config = require('../config/index')
const { database } = require('../config/db')
const MerchantID = config.get('newebpay.MerchantID')
const Version = config.get('newebpay.Version')
const NotifyUrl = config.get('newebpay.NotifyUrl')
const ReturnUrl = config.get('newebpay.ReturnUrl')
const PayGateWay = config.get('newebpay.PayGateWay')

const cartController = {
    /*
   * 取得購物車資料
   * @route GET /api/v1/cart
   */
    getCartItems: wrapAsync(async (req, res, next) => {
        const user_id = req.user.id;

        try{
            const cartsRepo = dataSource.getRepository('carts')
            const findCart = await cartsRepo.findOne({where: {user_id: user_id}})
            
            if(!findCart){
                return next(appError(404, '購物車尚未建立'))
            }
        
            const cart_id = findCart.id
            const cartItemsRepo = dataSource.getRepository('cart_items')
            const cartItemDetails = await getCartItemDetails(cartItemsRepo, cart_id)

            //回傳購物車課程數量跟總金額
            const summaryItems = await summaryCartItems(cartItemsRepo, cart_id) || { item_count: 0, total_price: 0 }

            return sendResponse(res, 200, true, '成功取得購物車清單', {
/*                     cart_id: cart_id, */
                cart_items: cartItemDetails,
                item_count: summaryItems?.item_count ?? 0, //只要結果是 0 或 "" 就回傳 0, 跟 ||不一樣
                total_price: summaryItems?.total_price ?? 0
            })
        }catch(error){
            next(error)
        }
    }),

    /*
   * 購物車加入課程, transaction 版, 只要一個資料表新增出錯，全部都 rollback！
   * @route POST /api/v1/cart
   */
    postCartItems: wrapAsync(async (req, res, next) => {
        await dataSource.transaction(async (manager) => {
            const cartsRepo = manager.getRepository('carts');
            const cartItemsRepo = manager.getRepository('cart_items');
            const courseRepo = manager.getRepository('courses');

            const user_id = req.user.id;
            const { course_id } = req.body;

            //檢查課程是否存在且狀態為上架
            const findCourse = await courseRepo.findOne({where:{ id: course_id,  course_status: '上架'}})
            if(!findCourse){
                return next(appError(404, "課程不存在或未上架"))
            }

            //取得我的課程資訊
            const studentCourseRepo = dataSource.getRepository('student_course')
            const findCourseIds = await studentCourseRepo.find({
                select:['course_id'],
                where: {user_id:user_id}
            })

            //取出課程 id
            const course_Ids = findCourseIds.map(item => item.course_id)

            //判斷是否有買過此課程
            if(course_Ids.includes(course_id)){
                return next(appError(400, "您已購買過此課程"))
            }

            try {
                // 查看此使用者是否建立購物車
                let findCart = await cartsRepo.findOne({
                    where:{ user_id:user_id }
                });

                // 若未建立購物車的話，就建立一個，建立後要取得 id
                if(!findCart){
                    const newCart = cartsRepo.create({ user_id:user_id });
                    findCart = await cartsRepo.save(newCart);
                }

                // 如果已建立購物車，取出購物車 id
                const cart_id = findCart.id;

                //查看購物車明細表是否有相同的課程
                
                const findItem = await cartItemsRepo.findOne({
                    where:{cart_id:cart_id, course_id:course_id}
                })

                if(findItem){
                    return next(appError(409, "此課程已存在購物車"))
                }

                //若沒有相同課程就新增課程
                const newItem = cartItemsRepo.create({cart_id: cart_id, course_id:course_id})
                await cartItemsRepo.save(newItem)

                //回傳購物車課程數量跟總金額
                const summaryItems = await summaryCartItems(cartItemsRepo, cart_id) || { item_count: 0, total_price: 0 }

                return sendResponse(res, 200, true, '成功加入課程到購物車', {
                    item_count: summaryItems?.item_count ?? 0, //只要結果是 0 或 "" 就回傳 0, 跟 ||不一樣
                    total_price: summaryItems?.total_price ?? 0
                })   

            } catch (error) {
                next(error)
            }                
        })
    }),

    //
    /**
    * 登入後整合購物車, 未登入購物車(未存在資料庫), 跟之前已登入的購物車(已存在資料庫)合併 
    * 1. 合併未登入與登入購物車的課程 id
    * 2. 查詢這些 id 是否在資料庫, 有就 isValid, 沒有就 isInValid
    * 3. 再查詢 isValid 這批 id 是否已經在登入後的購物車
    *    (1) 已存在： skip
    *    (2) 沒有： 批次新增 
    * 4. isInvalid 給 user 錯誤顯示        
    */
    mergeCartItems: wrapAsync(async (req, res, next) => {
        const user_id = req.user.id;
        const { course_ids } = req.body;

        //取得我的課程資訊
        const studentCourseRepo = dataSource.getRepository('student_course')
        const findCourseIds = await studentCourseRepo.find({
            select:['course_id'],
            where: {user_id:user_id}
        })

        //取出課程 id
        const course_Ids = findCourseIds.map(item => item.course_id)

        await dataSource.transaction(async (manager) => {
            const cartsRepo = manager.getRepository('carts');
            const cartItemsRepo = manager.getRepository('cart_items');
            const coursesRepo = manager.getRepository('courses')
            
            try {
                // 查看此使用者是否建立購物車
                let findCart = await cartsRepo.findOne({
                    where: { user_id: user_id }
                });

                // 若未建立購物車的話，就建立一個，建立後要取得 id
                if(!findCart){
                    const newCart = cartsRepo.create({ user_id: user_id });
                    findCart = await cartsRepo.save(newCart);
                }

                // 如果已建立購物車，取出購物車 id
                const cart_id = findCart.id;

                // 取出已存在購物車資料
                const cartItems = await cartItemsRepo.find({
                    where: {cart_id: cart_id}
                })

                // 取出已存在購物車資料, alreadyInCartIds
                const cartItemIds = cartItems?.map(item => item.course_id) || []

                //未登入前購物車 id 合併原購物車 id
                const mergeItemIds = Array.from(new Set([...(course_ids || []), ...cartItemIds]))

                //查看課程是否存在資料庫
                const validCourses = await coursesRepo.find({
                    where: {
                        id: In(mergeItemIds),
                        course_status: '上架'
                    }
                })

                if(validCourses.length===0){
                    return next(appError(404, "課程不存在或已下架"))
                }

                //先判斷是否存在資料庫且為上架狀態
                let isValidIds = validCourses.map(item => item.id)
                //不存在購物車或非上架狀態的課程
                let isInvalids = mergeItemIds.filter(id => !isValidIds.includes(id))
                
                //只取出未存在原購物車的 id，加入購物車
                let insertIds = isValidIds.filter(id => !cartItemIds.includes(id))
                
                //判斷是否有買過此課程
                // 已購買
                let myCourseIds = insertIds.filter(id => course_Ids.includes(id))
                // 未購買
                insertIds = insertIds.filter(id => !course_Ids.includes(id))

                //批次建立購物車物件 & 新增
                let result
                if(insertIds.length > 0){
                    const newItems = insertIds.map(id => ({
                        cart_id: cart_id, 
                        course_id:id
                    }))
                    result = await cartItemsRepo.save(newItems)
                }

                isInvalids = Array.from(new Set([...(isInvalids || []), ...myCourseIds]))

                //回傳購物車課程數量跟總金額
                const summaryItems = await summaryCartItems(cartItemsRepo, cart_id) || { item_count: 0, total_price: 0 }

                return sendResponse(res, 200, true, '成功加入課程到購物車', {
                    item_count: summaryItems?.item_count ?? 0, //只要結果是 0 或 "" 就回傳 0, 跟 ||不一樣
                    total_price: summaryItems?.total_price ?? 0,
                    errors: isInvalids.length > 0 ? {
                        reason: "課程不存在、課程已下架或課程已購買",
                        isInvalids: isInvalids
                    }: null
                })   

            } catch (error) {
                next(error)
            }                
        })
    }),

    /*
   * 刪除購物車資料
   * @route DELETE /api/v1/cart/:cartItemId
   */
    deleteCartItems: wrapAsync(async (req, res, next) => {
        const user_id = req.user.id;
        const { cartItemId } = req.params

        try{
            const cartsRepo = dataSource.getRepository('carts')
            const findCart = await cartsRepo.findOne({where:{user_id:user_id}})
            
            if(!findCart){
                return next(appError(404, '購物車尚未建立'))
            }

            const cart_id = findCart.id

            //查詢購物車明細
            const cartItemsRepo = dataSource.getRepository('cart_items')
            const findCartItem = await cartItemsRepo.findOne({where:{id:cartItemId}})                

            if(!findCartItem){
                return next(appError(400, '找不到該課程項目，可能已被刪除'))                
            }
            
            const deleteResult = await cartItemsRepo.delete(cartItemId)

            if(deleteResult.affected===0){
                return  next(appError(400, "ID 錯誤"))                
            }


            //回傳購物車課程數量跟總金額
            const summaryItems = await cartItemsRepo.createQueryBuilder('cartItems')
            .select(['COUNT(*)::int AS item_count', 
                    'COALESCE(SUM(course.sell_price),0)::int AS total_price'
                    ])
            .leftJoin('cartItems.courses', 'course')
            .where('cartItems.cart_id = :cart_id', { cart_id })
            .getRawOne()

            return sendResponse(res, 200, true, '成功刪除課程', {
                item_count: summaryItems?.item_count ?? 0, //只要結果是 0 或 "" 就回傳 0, 跟 ||不一樣
                total_price: summaryItems?.total_price ?? 0
            })
        }catch(error){
            next(error)
        }
    }),

    /*
   * 結帳
   * @route POST - /api/v1/cart/checkout
   */
    checkout: wrapAsync(async (req, res, next) => {
        const user_id = req.user.id
        const { coupon_id, coupon, discount_amount } = req.body       

        try{
            const cartsRepo = dataSource.getRepository('carts')
            const findCart = await cartsRepo.findOne({where:{user_id:user_id}})
            
            if(!findCart){
                return next(appError(404, '購物車尚未建立'))
            }
            
            const usersRepo = dataSource.getRepository('users')
            const findUser = await usersRepo.findOne({
                where: {id:user_id}
            })

            const email = findUser.email
            const cart_id = findCart.id
            const cartItemsRepo = dataSource.getRepository('cart_items')
            const cartItemDetails = await getCartItemDetails(cartItemsRepo, cart_id)
            const course_ids = cartItemDetails.map(item =>item.course_id)

            //取得我的課程資訊
            const studentCourseRepo = dataSource.getRepository('student_course')
            const findCourseIds = await studentCourseRepo.find({
                select:['course_id'],
                where: {user_id:user_id}
            })

            //取出課程 id
            const studentCourseIds = findCourseIds.map(item => item.course_id)

            //判斷課程是否購買
            const alreadyBoughtIds = course_ids.filter( id => studentCourseIds.includes(id))

            //判斷是否有買過此課程
            if(alreadyBoughtIds.length){
                return next(appError(400, `您已購買過這些課程 ${alreadyBoughtIds}`))
            }

            //回傳購物車課程數量跟總金額
            const summaryItems = await summaryCartItems(cartItemsRepo, cart_id) || { item_count: 0, total_price: 0 }

            const TimeStamp = Math.round(new Date().getTime()/1000)
            
            const order = {
                Email: email,
                ItemDesc: course_ids.join(','),   //course_ids.join(',')
                TimeStamp,
                Amt: summaryItems.total_price-(Number(discount_amount)||0),
                MerchantOrderNo: TimeStamp
            }

            const aesEncrypt = createAesEncrypt(order)
            const shaEncrypt = createShaEncrypt(aesEncrypt)

            const orderRepo = dataSource.getRepository('order')

            if(summaryItems.total_price - Number(discount_amount)<0){
                return next(appError(404, '折扣金額有誤'))
            }

            const newOrder = orderRepo.create({
                user_id: user_id,
                coupon_id: coupon_id, //escapeHtml.escape(coupon_id)
                discount_amount: Number(discount_amount)||0,  //escapeHtml.escape(discount_amount)
                final_amount: summaryItems.total_price - (Number(discount_amount)||0), //escapeHtml.escape(discount_amount)
                order_number: String(order.MerchantOrderNo),
                payment_status: 'pending',
                pay_trade_no: '',
                pay_check_mac_value: shaEncrypt
            })
            const result = await orderRepo.save(newOrder)

            const insertOrderItems = cartItemDetails.map(item => {
                return {order_id: result.id,
                        course_id: item.course_id, 
                        price: item.price}
            })
            const orderItemRepo = dataSource.getRepository('order_item')
            const newOrderItem = orderItemRepo.create(insertOrderItems)
            await orderItemRepo.save(newOrderItem)
            
            await cartItemsRepo.delete({cart_id: cart_id})   
            await cartsRepo.delete({id: cart_id})
/*          //正式用，不顯示表單  
            const html = `<form action="${PayGateWay}" method="post" style:"display:none">
                        <input type="hidden" name="MerchantID" value="${MerchantID}" />
                        <input type="hidden" name="TradeSha" value="${shaEncrypt}" />
                        <input type="hidden" name="TradeInfo" value="${aesEncrypt}" />
                        <input type="hidden" name="TimeStamp" value="${TimeStamp}" />
                        <input type="hidden" name="Version" value="${Version}" />
                        <input type="hidden" name="NotifyUrl" value="${NotifyUrl}" />
                        <input type="hidden" name="ReturnUrl" value="${ReturnUrl}" />
                        <input type="hidden" name="MerchantOrderNo" value="${order.MerchantOrderNo}" />
                        <input type="hidden" name="Amt" value="${order.Amt}" />
                        <input type="hidden" name="ItemDesc" value="${order.ItemDesc}" />
                        <input type="hidden" name="Email" value="${email}" />
                    </form>` */

                //測試用，顯示表單
                const html = `<form action="${PayGateWay}" method="post">
                    <input type="text" name="MerchantID" value="${MerchantID}" />
                    <input type="text" name="TradeSha" value="${shaEncrypt}" />
                    <input type="text" name="TradeInfo" value="${aesEncrypt}" />
                    <input type="text" name="TimeStamp" value="${TimeStamp}" />
                    <input type="text" name="Version" value="${Version}" />
                    <input type="text" name="NotifyUrl" value="${NotifyUrl}" />
                    <input type="text" name="ReturnUrl" value="${ReturnUrl}" />
                    <input type="text" name="MerchantOrderNo" value="${order.MerchantOrderNo}" />
                    <input type="text" name="Amt" value="${order.Amt}" />
                    <input type="text" name="ItemDesc" value="${order.ItemDesc}" />
                    <input type="email" name="Email" value="${email}" />
                </form>`

            res.send(html)

        }catch(error){
            next(error)
        }
    }),

    /*
   * 收到藍新金流訊息, 傳送給前端
   * @route POST - /api/v1/payment/newebpay_return
   */
    newebpayReturn: wrapAsync(async (req, res, next) => {
        // #swagger.ignore = true
        const response = req.body
        const data = createAesDecrypt(response.TradeInfo)

        const orderRepo = dataSource.getRepository('order')
        const findOrder = await orderRepo.findOne({
            select: ['id'],
            where: { order_number: data.Result.MerchantOrderNo}
            }
        )

        const order_id = findOrder.id

        const orderItemRepo = dataSource.getRepository('order_item')
        const result = await orderItemRepo.createQueryBuilder('orderItem')
        .select([
            'course.course_small_imageUrl AS course_small_imageUrl',
            'course.course_name AS course_name',
            'orderItem.price AS price'
        ])
        .leftJoin('orderItem.courses', 'course')
        .where('orderItem.order_id = :order_id', { order_id })
        .getRawMany()

        const renderData = {
            "payway": data.Result.PaymentType,
            "final_amount": data.Result.Amt,
            "payment_status": data.Status,
            "payment_date": data.Result.PayTime,
            "order_number": data.Result.MerchantOrderNo,
            "order_items": result,
            "item_count": result.length
        }

              // 傳回 JSON 給前端，token= 測試用(暫不考慮安全性)
        return res.redirect(
            `${process.env.FRONTEND_URL}/home/cart-flow/order-success?renderData=${encodeURIComponent(JSON.stringify(renderData))}`
        )

/*         return res.redirect(
            `/index.html?renderData=${encodeURIComponent(JSON.stringify(renderData))}`
        ) */
        // 二選一，傳送表單或是 json 檔
        const html = renderOrderHtml(renderData)
        res.send(html)

        /* return res.status(200).json({
            status:true,
            message: "結帳成功",
            data: {
                    "payway": data.Result.PaymentType,
                    "final_amount": data.Result.Amt,
                    "payment_status": data.status,
                    "payment_date": data.Result.PayTime,
                    "order_number": data.Result.MerchantOrderNo,
                    "order_items": result,
                    "item_count": result.length
                }
        }) */
    }),

    /*
   * 收到藍新金流訊息, 後端更新資料庫狀態
   * @route POST - /api/v1/payment/newebpay_notify
   */
    newebpayNotify: wrapAsync(async (req, res, next) => {
        // #swagger.ignore = true
        const response = req.body
        const data = createAesDecrypt(response.TradeInfo)

        const thisShaEncrypt = createShaEncrypt(response.TradeInfo)
    
        if(!thisShaEncrypt === response.TradeSha){
            console.log('付款失敗：TradeSha 不一致')

            return next(appError(400, '付款失敗'))
        } 

        const payment_status =  data.Status==='SUCCESS'?'paid':'failed'
        const orderRepo = dataSource.getRepository('order')
        const updateOrder = await orderRepo.update({order_number: data.Result.MerchantOrderNo}, {
            payway: data.Result.PaymentType,
            payment_status: payment_status,
            payment_date: data.Result.PayTime,
            pay_trade_no: data.Result.TradeNo,
            pay_rtn_msg: JSON.stringify(data.Result)
            }
        )
        
        //取得訂單
        const findOrder = await orderRepo.findOne({where: {order_number: data.Result.MerchantOrderNo}})

        const user_id = findOrder.user_id
        const order_id = findOrder.id
        const purchase_date = findOrder.PayTime

        // 取得訂單詳細項目
        const orderItemRepo = dataSource.getRepository('order_item')
        const orderCourse = await orderItemRepo.find({where:{order_id:order_id}})

        //新增學生課程表課程
        const studentCourseRepo = dataSource.getRepository('student_course')
        const courseRepo = dataSource.getRepository('courses')

        let newStudentCourse, findCourse, total_users, updateCourse
        for(const course of orderCourse){
            newStudentCourse = studentCourseRepo.create({
                user_id: user_id,
                course_id: course.course_id,
                last_accessed_at: purchase_date
            })
            await studentCourseRepo.save(newStudentCourse)

            findCourse = await courseRepo.findOne({where:{id:course.course_id}})

            // 新增課程人數
            if(findCourse){
                total_users = findCourse?.total_users?findCourse?.total_users+1:1
                updateCourse = await courseRepo.update({id:course.course_id},{total_users: total_users})
            }

        }

        return sendResponse(res, 200, true, '結帳成功', data)
    }),

}
module.exports = cartController

