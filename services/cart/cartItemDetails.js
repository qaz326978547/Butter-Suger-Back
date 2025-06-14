const { dataSource } = require('../../db/data-source')

// 取出購物車資料
async function getCartItemDetails(cartItemsRepo, cart_id){
    //查詢購物車明細
    const findCartItems = await cartItemsRepo.find({where:{cart_id:cart_id}})                

    if(!findCartItems){
        return sendResponse(res, 200, true, '購物車是空的', {
/*             cart_id: cart_id, */
            cart_items: [],
            item_count: 0,
            total_price: 0                            
        })                  
    }

    // 取出購物車資料
    const cartItemDetails = await cartItemsRepo.createQueryBuilder('cartItems')
    .select(['cartItems.id AS cart_item_id', 'cartItems.course_id AS course_id', 'course.course_small_imageUrl AS course_small_imageUrl', 'course.course_name AS course_name', 'course.sell_price AS price' ])
    .leftJoin('cartItems.courses', 'course')
    .where({ cart_id:cart_id })
    .getRawMany()

    return cartItemDetails
}

module.exports = getCartItemDetails