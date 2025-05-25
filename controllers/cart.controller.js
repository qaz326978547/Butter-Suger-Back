const { dataSource } = require('../db/data-source')
const { appError, sendResponse } = require('../utils/responseFormat')
const cleanUndefinedFields = require('../utils/cleanUndefinedFields')

    const cartController = {
        //取得購物車資料
        async getCartItems(req, res, next){
            const user_id = req.user.id;

            try{
                const cartsRepo = dataSource.getRepository('carts')
                const findCart = await cartsRepo.findOne({where:{user_id:user_id}})
                
                if(!findCart){
                    return sendResponse(res, 200, true, '購物車尚未建立')
                }

                const cart_id = findCart.id

                //查詢購物車明細
                const cartItemsRepo = dataSource.getRepository('cart_items')
                const findCartItems = await cartItemsRepo.find({where:{cart_id:cart_id}})                

                if(!findCartItems){
                    return sendResponse(res, 200, true, '購物車是空的', {
                        cart_id: cart_id,
                        cart_items: [],
                        item_count: 0,
                        total_price: 0                            
                    })                  
                }

                const courseItems = await cartItemsRepo.createQueryBuilder('cartItems')
                .select(['cartItems.id AS cart_item_id', 'cartItems.course_id AS course_id', 'course.course_smallimage AS course_smallimage', 'course.course_name AS course_name', 'course.sell_price AS price' ])
                .leftJoin('cartItems.courses', 'course')
                .getRawMany()

                //回傳購物車課程數量跟總金額
                const summaryItems = await cartItemsRepo.createQueryBuilder('cartItems')
                .select(['COUNT(*)::int AS item_count', 
                        'COALESCE(SUM(course.sell_price),0)::int AS total_price'
                        ])
                .leftJoin('cartItems.courses', 'course')
                .where('cartItems.cart_id = :cart_id', { cart_id })
                .getRawOne()

                return sendResponse(res, 200, true, '成功取得購物車清單', {
                    cart_id: cart_id,
                    cart_items: courseItems,
                    item_count: summaryItems?.item_count ?? 0, //只要結果是 0 或 "" 就回傳 0, 跟 ||不一樣
                    total_price: summaryItems?.total_price ?? 0
                })
            }catch(error){
                next(error)
            }
        },

        //新增購物車資料, transaction 版, 只要一個資料表新增出錯，全部都 rollback！
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
                    const summaryItems = await cartItemsRepo.createQueryBuilder('cartItems')
                    .select(['COUNT(*)::int AS item_count', 
                            'COALESCE(SUM(course.sell_price),0)::int AS total_price' 
                            ]) // COALESCE 把 NULL 改成 0，確保 total_price 一定有數字
                    .leftJoin('cartItems.courses', 'course')
                    .where('cartItems.cart_id = :cart_id', { cart_id })
                    .getRawOne()
    
                    return sendResponse(res, 200, true, {
                        item_count: summaryItems?.item_count ?? 0, //只要結果是 0 或 "" 就回傳 0, 跟 ||不一樣
                        total_price: summaryItems?.total_price ?? 0
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

    }
module.exports = cartController

