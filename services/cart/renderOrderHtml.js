// 結帳 render 頁面
function renderOrderHtml(data) {
  const itemsHtml = data.order_items.map(item => `
    <div class="item-card">
      <img class="item-img" src="${item.course_small_imageurl}" alt="課程封面">
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
          background: #1a202c;
          font-family: "Noto Sans TC", "Microsoft JhengHei", Arial, sans-serif;
          margin: 0;
          padding: 0;
          color: #f1f5f9;
        }
        .center-box {
          max-width: 430px;
          margin: 60px auto 0;
          padding: 32px 28px 24px;
          background: #232c3a;
          border-radius: 22px;
          box-shadow: 0 4px 32px 0 #0005;
        }
        .title {
          font-size: 2rem;
          color: #70e09a;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 12px;
          text-align: center;
          text-shadow: 0 2px 6px #141b23b7;
        }
        .sub-title {
          font-size: 1rem;
          color: #cbd5e1;
          margin-bottom: 20px;
          text-align: center;
        }
        .order-info {
          background: #222736;
          border-radius: 8px;
          padding: 18px;
          margin-bottom: 18px;
          box-shadow: 0 1px 6px #141b2360;
        }
        .order-info p {
          margin: 0 0 6px 0;
          font-size: 1rem;
          color: #e0e7ef;
        }
        .order-info .em {
          font-weight: 700;
          color: #49e39e;
        }
        .order-list-title {
          margin: 16px 0 10px 0;
          font-size: 1.05rem;
          color: #a0aec0;
          font-weight: bold;
          border-bottom: 1px solid #334155;
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
          background: #293241;
          border-radius: 12px;
          padding: 10px 12px;
          box-shadow: 0 1px 8px #0002;
          gap: 12px;
          border: 1px solid #364157;
        }
        .item-img {
          width: 54px;
          height: 54px;
          border-radius: 8px;
          background: #222a37;
          object-fit: cover;
          border: 1px solid #38455d;
          box-shadow: 0 2px 8px #1a202c33;
        }
        .item-info {
          flex: 1;
        }
        .item-name {
          font-size: 1.05rem;
          color: #d1fae5;
          font-weight: 500;
          margin-bottom: 2px;
          text-shadow: 0 1px 6px #212d3b36;
        }
        .item-price {
          color: #ffab70;
          font-weight: 700;
          font-size: 1rem;
          text-shadow: 0 1px 6px #212d3b36;
        }
        .count-row {
          font-size: 0.98rem;
          color: #f1f5f9b2;
          text-align: right;
          margin-top: 6px;
        }
        .back-btn {
          display: block;
          width: 100%;
          padding: 12px 0;
          background: linear-gradient(90deg, #38b2ac 0%, #81e6d9 100%);
          color: #212d3b;
          border: none;
          border-radius: 8px;
          font-size: 1.08rem;
          font-weight: bold;
          margin-top: 18px;
          cursor: pointer;
          box-shadow: 0 2px 16px #38b2ac66;
          transition: background 0.16s, color 0.16s;
          letter-spacing: 2px;
        }
        .back-btn:hover {
          background: linear-gradient(90deg, #3182ce 0%, #38b2ac 100%);
          color: #fff;
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
      <button class="back-btn" onclick="window.location.href='https://buttersuger-frontend.zeabur.app/'">返回首頁</button>
    </div>
  </body>
  </html>
  `
}


module.exports = renderOrderHtml