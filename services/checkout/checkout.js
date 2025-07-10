const crypto = require('crypto');
const config = require('../../config/index')

const HASHKEY = config.get('newebpay.HASHKEY')
const HASHIV = config.get('newebpay.HASHIV')
const MerchantID = config.get('newebpay.MerchantID')
const Version = config.get('newebpay.Version')
const NotifyUrl = config.get('newebpay.NotifyUrl')
const ReturnUrl = config.get('newebpay.ReturnUrl')
const RespondType = 'JSON';

function genDataChain(order) {
    return `MerchantID=${MerchantID}&TimeStamp=${
      order.TimeStamp
    }&Version=${Version}&RespondType=${RespondType}&MerchantOrderNo=${
      order.MerchantOrderNo
    }&Amt=${order.Amt}&NotifyURL=${encodeURIComponent(
      NotifyUrl,
    )}&ReturnURL=${encodeURIComponent(ReturnUrl)}&ItemDesc=${encodeURIComponent(
      order.ItemDesc,
    )}&Email=${encodeURIComponent(order.Email)}`;
  }

function createAesEncrypt(TradeInfo) {
    const encrypt = crypto.createCipheriv('aes-256-cbc', HASHKEY, HASHIV);
    const enc = encrypt.update(genDataChain(TradeInfo), 'utf8', 'hex');
    return enc + encrypt.final('hex');
}

function createShaEncrypt(aesEncrypt) {
    const sha = crypto.createHash('sha256');
    const plainText = `HashKey=${HASHKEY}&${aesEncrypt}&HashIV=${HASHIV}`;
    return sha.update(plainText).digest('hex').toUpperCase();
}

//AES 解密
function createAesDecrypt(TradeInfo) {
    const decrypt = crypto.createDecipheriv('aes-256-cbc', HASHKEY, HASHIV);
    decrypt.setAutoPadding(false);
    const text = decrypt.update(TradeInfo, 'hex', 'utf8');
    const plainText = text + decrypt.final('utf8');
    const result = plainText.replace(/[\x00-\x20]+/g, '');
    return JSON.parse(result);
}

module.exports = {
    genDataChain,
    createAesEncrypt,
    createShaEncrypt,
    createAesDecrypt
}
