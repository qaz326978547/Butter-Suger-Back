function renderOrderHtml(data) {
    const itemsHtml = data.order_items.map(item => `
      <div class="item-card">
        <img class="item-img" src="${item.course_small_imageUrl}" alt="課程封面">
        <div class="item-info">
          <div class="item-name">${item.course_name}</div>
          <div class="item-price">NT$ ${item.price}</div>
        </div>
      </div>
    `).join('');
    return `
    <!DOCTYPE html>
    <html lang="zh-Hant">
    <head>
        <meta charset="UTF-8">
        <title>結帳成功</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {
            background: #f9f9fb;
            font-family: "Noto Sans TC", "Microsoft JhengHei", Arial, sans-serif;
            margin: 0;
            padding: 0;
            }
            .center-box {
            max-width: 430px;
            margin: 60px auto 0;
            padding: 32px 28px 24px;
            background: #fff;
            border-radius: 22px;
            box-shadow: 0 4px 32px 0 #b4bac02b;
            }
            .title {
            font-size: 2rem;
            color: #5cb85c;
            font-weight: 700;
            letter-spacing: 2px;
            margin-bottom: 12px;
            text-align: center;
            }
            .sub-title {
            font-size: 1rem;
            color: #444;
            margin-bottom: 20px;
            text-align: center;
            }
            .order-info {
            background: #f7fafc;
            border-radius: 8px;
            padding: 18px;
            margin-bottom: 18px;
            }
            .order-info p {
            margin: 0 0 6px 0;
            font-size: 1rem;
            color: #333;
            }
            .order-info .em {
            font-weight: 700;
            color: #1a7f37;
            }
            .order-list-title {
            margin: 16px 0 10px 0;
            font-size: 1.05rem;
            color: #888;
            font-weight: bold;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
            }
            .order-items {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 8px;
            }
            .item-card {
            display: flex;
            align-items: center;
            background: #f3f6fa;
            border-radius: 12px;
            padding: 10px 12px;
            box-shadow: 0 1px 5px #eee3;
            gap: 12px;
            }
            .item-img {
            width: 54px;
            height: 54px;
            border-radius: 8px;
            background: #eee;
            object-fit: cover;
            border: 1px solid #ddd;
            }
            .item-info {
            flex: 1;
            }
            .item-name {
            font-size: 1.05rem;
            color: #2d3748;
            font-weight: 500;
            margin-bottom: 2px;
            }
            .item-price {
            color: #ea580c;
            font-weight: 700;
            font-size: 1rem;
            }
            .count-row {
            font-size: 0.98rem;
            color: #444;
            text-align: right;
            margin-top: 6px;
            }
            .back-btn {
            display: block;
            width: 100%;
            padding: 12px 0;
            background: #65cfa4;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 1.08rem;
            font-weight: bold;
            margin-top: 18px;
            cursor: pointer;
            box-shadow: 0 2px 8px #afeedcb9;
            transition: background 0.16s;
            }
            .back-btn:hover {
            background: #37b284;
            }
        </style>
    </head>
    <body>
      <div class="center-box">
        <div class="title">結帳成功</div>
        <div class="sub-title">感謝您的訂購，以下是您的訂單明細</div>
        <div class="order-info">
          <p><span class="em">付款狀態：</span>${data.payment_status}</p>
          <p><span class="em">金額：</span>NT$${data.final_amount}</p>
          <p><span class="em">訂單編號：</span>${data.order_number}</p>
          <p><span class="em">下單時間：</span>${data.payment_date}</p>
          <p><span class="em">付款方式：</span>${data.payway}</p>
        </div>
        <div class="order-list-title">購買項目</div>
        <div class="order-items">
          ${itemsHtml}
        </div>
        <div class="count-row">共 ${data.item_count} 項</div>
        <button class="back-btn" onclick="window.location.href='/'">返回首頁</button>
      </div>
    </body>
    </html>
    `
  }
  

module.exports = renderOrderHtml