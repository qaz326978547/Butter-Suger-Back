const { dataSource } = require('../../db/data-source')

// 計算購物車的數量及金額
async function summaryCartItems(cartItemsRepo, cart_id){
    return await cartItemsRepo.createQueryBuilder('cartItems')
    .select(['COUNT(*)::int AS item_count', 
            'COALESCE(SUM(course.sell_price),0)::int AS total_price' 
            ]) // COALESCE 把 NULL 改成 0，確保 total_price 一定有數字
    .leftJoin('cartItems.courses', 'course')
    .where('cartItems.cart_id = :cart_id', { cart_id })
    .where('course.course_status = :course_status', { course_status: '上架'})
    .getRawOne()
}

module.exports = summaryCartItems