const { dataSource } = require('../db/data-source')
const { appError, sendResponse } = require('../utils/responseFormat')
const wrapAsync = require('../utils/wrapAsync')
const cleanUndefinedFields = require('../utils/cleanUndefinedFields')

const orderController = {
    /*
    * 取得所有訂單
    * @route PATCH - /api/v1/users/orders
    */
    getOrderList: wrapAsync(async (req, res, next) => {
        const user_id = req.user.id
        
        const orderItemRepo = dataSource.getRepository('order_item')
        const result = await orderItemRepo.createQueryBuilder('orderItem')
        .select([
            'order.order_number AS order_number', 
            'array_agg(course.course_name) AS course_name', 
            'order.final_amount AS final_amount', 
            'order.created_at AS created_at'])
        .leftJoin('orderItem.order', 'order')
        .leftJoin('orderItem.courses', 'course')
        .where('order.user_id = :user_id AND order.payment_status = :status', {user_id: user_id, status: 'paid'})
        .groupBy('order.order_number')
        .addGroupBy('order.final_amount')
        .addGroupBy('order.created_at')
        .getRawMany()

        const orderResult = result.map(order => {
            return {
                ...order,
                course_count: order.course_name ? order.course_name.length : 0
            }
        })
        
        return sendResponse(res, 200, true, '成功取得訂單', orderResult)
    }),

    /*
    * 取得單筆訂單
    * @route PATCH - /api/v1/users/order/:order-number
    */
    getOrder: wrapAsync(async (req, res, next) => {
        const user_id = req.user.id
        const order_number = req.params.orderNumber
        
        const orderItemRepo = dataSource.getRepository('order_item')
        const orderResult = await orderItemRepo.createQueryBuilder('orderItem')
        .select([
            'order.order_number AS order_number', 
            'array_agg(course.course_name) AS course_name', 
            'order.final_amount AS final_amount', 
            'order.pay_rtn_msg AS pay_rtn_msg', 
            'order.created_at AS created_at'
        ])
        .leftJoin('orderItem.order', 'order')
        .leftJoin('orderItem.courses', 'course')
        .where('order.user_id = :user_id AND order.payment_status = :status AND order.order_number = :order_number', {user_id: user_id, status: 'paid', order_number: order_number})
        .groupBy('order.order_number')
        .addGroupBy('order.final_amount')
        .addGroupBy('order.pay_rtn_msg')
        .addGroupBy('order.created_at')
        .getRawMany()

        const courseResult = await orderItemRepo.createQueryBuilder('orderItem')
        .select([
            'course.id AS course_id',
            'course.course_small_imageUrl AS course_small_imageUrl',
            'course.course_name AS course_name',
            'course.origin_price AS origin_price',
            'course.sell_price AS sell_price'
        ])
        .leftJoin('orderItem.order', 'order')
        .leftJoin('orderItem.courses', 'course')
        .where('order.user_id = :user_id AND order.payment_status = :status AND order.order_number = :order_number', {user_id: user_id, status: 'paid', order_number: order_number})
        .getRawMany()

        const parsedResult = orderResult.map(row => {
            const { pay_rtn_msg, ...rest } = row
            return {
                ...rest,
                payway: JSON.parse(row.pay_rtn_msg).PaymentType, 
                order_items: courseResult
                /* ,
                pay_rtn_msg: row.pay_rtn_msg?JSON.parse(row.pay_rtn_msg):null */
            }
        })

        return sendResponse(res, 200, true, '成功取得訂單', parsedResult)
    })
}

module.exports = orderController