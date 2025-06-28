const { dataSource } = require('../db/data-source')
const { appError, sendResponse } = require('../utils/responseFormat')
const cleanUndefinedFields = require('../utils/cleanUndefinedFields')
const getCartItemDetails = require('../services/cart/cartItemDetails')
const summaryCartItems = require('../services/cart/summaryCartItems')
const renderOrderHtml = require('../services/cart/renderOrderHtml')
const { createAesEncrypt, createShaEncrypt, createAesDecrypt } = require('../services/checkout/checkout')
const { In } = require('typeorm')
const escapeHtml = require('he')  //防止 html 注入攻擊，最後再補上
const config = require('../config/index')
const MerchantID = config.get('newebpay.MerchantID')
const Version = config.get('newebpay.Version')
const NotifyUrl = config.get('newebpay.NotifyUrl')
const ReturnUrl = config.get('newebpay.ReturnUrl')
const PayGateWay = config.get('newebpay.PayGateWay')

const cartController = {
    //取得購物車資料
    async getCartItems(req, res, next){
        const user_id = req.user.id;

        try{
            const cartsRepo = dataSource.getRepository('carts')
            const findCart = await cartsRepo.findOne({where: {user_id: user_id}})
            
            if(!findCart){
                return sendResponse(res, 200, true, '購物車尚未建立')
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
    },

    //新增購物車資料,需補上課程是否存在資料庫, transaction 版, 只要一個資料表新增出錯，全部都 rollback！
    async postCartItems(req, res, next){
        await dataSource.transaction(async (manager) => {
            const cartsRepo = manager.getRepository('carts');
            const cartItemsRepo = manager.getRepository('cart_items');

            const user_id = req.user.id;
            const { course_id } = req.body;

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
    },

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
    async mergeCartItems(req, res, next){
        const user_id = req.user.id;
        const { course_ids } = req.body;

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

                //只取出 course 的 id
                const isValidIds = validCourses.map(item => item.id)
                const isInvalids = mergeItemIds.filter(id => !isValidIds.includes(id))
                
                //只取出未存在原購物車的 id
                const insertIds = isValidIds.filter(id => !cartItemIds.includes(id))

                //批次建立購物車物件 & 新增
                let result
                if(insertIds.length > 0){
                    const newItems = insertIds.map(id => ({
                        cart_id: cart_id, 
                        course_id:id
                    }))
                    result = await cartItemsRepo.save(newItems)
                }

                //回傳購物車課程數量跟總金額
                const summaryItems = await summaryCartItems(cartItemsRepo, cart_id) || { item_count: 0, total_price: 0 }

                return sendResponse(res, 200, true, '成功加入課程到購物車', {
                    item_count: summaryItems?.item_count ?? 0, //只要結果是 0 或 "" 就回傳 0, 跟 ||不一樣
                    total_price: summaryItems?.total_price ?? 0,
                    errors: isInvalids.length > 0 ? {
                        reason: "課程不存在或已下架",
                        course_ids: isInvalids
                    }: null
                })   

            } catch (error) {
                next(error)
            }                
        })
    },

    //刪除購物車資料
    async deleteCartItems(req, res, next){
        const user_id = req.user.id;
        const { cartItemId } = req.params

        try{
            const cartsRepo = dataSource.getRepository('carts')
            const findCart = await cartsRepo.findOne({where:{user_id:user_id}})
            
            if(!findCart){
                return sendResponse(res, 200, true, '購物車尚未建立')
            }

            const cart_id = findCart.id

            //查詢購物車明細
            const cartItemsRepo = dataSource.getRepository('cart_items')
            const findCartItem = await cartItemsRepo.findOne({where:{id:cartItemId}})                

            if(!findCartItem){
                return sendResponse(res, 200, true, '找不到該課程項目，可能已被刪除')                  
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
    },

    //結帳
    async checkout(req, res, next){
        console.log("=============checkout============")
        const user_id = req.user.id
        const { coupon_id, coupon, discount_amount } = req.body

        console.log("=============checkout============")
        console.log("req.user.id: ", req.user.id)
        console.log("coupon_id: ", coupon_id)
        console.log("coupon: ", coupon)
        console.log("discount_amount: ", discount_amount)
        console.log("=============checkout============")       

        try{
            const cartsRepo = dataSource.getRepository('carts')
            const findCart = await cartsRepo.findOne({where:{user_id:user_id}})
            
            if(!findCart){
                return sendResponse(res, 200, true, '購物車尚未建立')
            }
            
            const usersRepo = dataSource.getRepository('users')
            const findUser = await usersRepo.findOne({
                where: {id:user_id}
            })

            console.log("==============checkout findUser=============")
            console.log(findUser)
            console.log("==============checkout findUser=============")

            const email = findUser.email
            const cart_id = findCart.id
            const cartItemsRepo = dataSource.getRepository('cart_items')
            const cartItemDetails = await getCartItemDetails(cartItemsRepo, cart_id)
            
            console.log("==============checkout cartItemDetails=============")
            console.log(cartItemDetails)
            console.log("==============checkout cartItemDetails=============")

            const course_ids = cartItemDetails.map(item =>item.course_id)

            console.log("==============checkout=============")
            console.log(course_ids)
            console.log("==============checkout=============")

            //回傳購物車課程數量跟總金額
            const summaryItems = await summaryCartItems(cartItemsRepo, cart_id) || { item_count: 0, total_price: 0 }

            console.log("==============checkout1=============")
            const TimeStamp = Math.round(new Date().getTime()/1000)
            
            const order = {
                Email: email,
                ItemDesc: course_ids.join(','),   //course_ids.join(',')
                TimeStamp,
                Amt: summaryItems.total_price-(Number(discount_amount)||0),
                MerchantOrderNo: TimeStamp
            }
        
            console.log("==============checkout order=============")
            console.log(order)    
            console.log("==============checkout order=============")

            const aesEncrypt = createAesEncrypt(order)
            const shaEncrypt = createShaEncrypt(aesEncrypt)
            
            console.log("==============checkout Encrypt=============")
            console.log("aesEncrypt: ", aesEncrypt)    
            console.log("shaEncrypt: ", shaEncrypt) 
            console.log("==============checkout Encrypt=============")

            console.log("==============checkout newOrder=============")
            console.log({
                user_id: user_id,
                coupon_id: coupon_id, //escapeHtml.escape(coupon_id)
                discount_amount: discount_amount,  //escapeHtml.escape(discount_amount)
                final_amount: summaryItems.total_price-(Number(discount_amount)||0), //escapeHtml.escape(discount_amount)
                order_number: order.MerchantOrderNo,
                payment_status: 'pending',
                pay_trade_no: '',
                pay_check_mac_value: shaEncrypt
            })
            console.log("==============checkout newOrder=============")

            const orderRepo = dataSource.getRepository('order')
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
            console.log("==============checkout result=============")
            console.log(result)
            console.log("==============checkout result=============")


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
                        <button type="submit">送出訂單</button>
                    </form>`

            res.send(html)

        }catch(error){
            next(error)
        }
    },

    async newebpayReturn(req, res, next){
        // #swagger.ignore = true
        const response = req.body
        console.log("============newebpayReturn req.body============")
        console.log(req.body)
        console.log("============newebpayReturn req.body============")

        const data = createAesDecrypt(response.TradeInfo)

        console.log("============newebpayReturn data============")
        console.log(data)
        console.log("============newebpayReturn data============")

        const orderRepo = dataSource.getRepository('order')
        const findOrder = await orderRepo.findOne({
            select: ['id'],
            where: { order_number: data.Result.MerchantOrderNo}
            }
        )

        const order_id = findOrder.id
        console.log("============newebpayReturn data findOrder============")
        console.log(findOrder)
        console.log("============newebpayReturn data findOrder============")

        const orderItemRepo = dataSource.getRepository('order_item')
        const result = await orderItemRepo.createQueryBuilder('orderItem')
        .select([
            'course.course_smallimage AS course_smallimage',
            'course.course_name AS course_name',
            'orderItem.price AS price'
        ])
        .leftJoin('orderItem.courses', 'course')
        .where('orderItem.order_id = :order_id', { order_id }) // <-- 這裡
        .getRawMany()

        console.log("================newebpayReturn result return==================")
        console.log(result)
        console.log("================newebpayReturn result return==================")

        const renderData = {
            "payway": data.Result.PaymentType,
            "final_amount": data.Result.Amt,
            "payment_status": data.Status,
            "payment_date": data.Result.PayTime,
            "order_number": data.Result.MerchantOrderNo,
            "order_items": result,
            "item_count": result.length
        }

        console.log("=================================")
        const html = renderOrderHtml(renderData)
        res.send(html)

/*         return res.status(200).json({
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
    },
    async newebpayNotify(req, res, next){
        // #swagger.ignore = true
        const response = req.body
        const data = createAesDecrypt(response.TradeInfo)

        console.log("============newebpay_notify data============")
        console.log(data)
        console.log("============newebpay_notify data============")

        const thisShaEncrypt = createShaEncrypt(response.TradeInfo)
    
        if(!thisShaEncrypt === response.TradeSha){
            console.log('付款失敗：TradeSha 不一致')

            return sendResponse(res, 400, false, '付款失敗')
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

        console.log("============newebpay_notify Result============")
        console.log(data?.Result)
        console.log("============newebpay_notify Result============")

        console.log("============newebpay_notify 更新 order============")
        console.log(updateOrder)
        console.log("============newebpay_notify 更新 order============")
        
        return sendResponse(res, 200, true, '結帳成功', data)
    },

}
module.exports = cartController

