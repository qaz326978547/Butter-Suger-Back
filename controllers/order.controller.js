const { dataSource } = require('../db/data-source')
const { appError, sendResponse } = require('../utils/responseFormat')
const cleanUndefinedFields = require('../utils/cleanUndefinedFields')

const orderController = {
    /*
    * 取得所有訂單
    * @route PATCH - /api/v1/users/orders
    */
    async getOrderList(req, res, next){
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

        return sendResponse(res, 200, true, '成功取得訂單', result)
    }
}

module.exports = orderController