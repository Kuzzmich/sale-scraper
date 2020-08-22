const config = require('config');
const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');
const FileType = require('file-type');
const bot = require('./telegramBot');
const helpers = require('./helpers');

const getMongoClient = async () => {
  return await MongoClient.connect(config.mongoConnectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
};

const syncProductsCollection = async (productsList) => {
  const client = await getMongoClient();
  const db = client.db(config.mongoDbName);
  const filterQuery = {'shop': (productsList[0] || {}).shop || ''};
  const oldProducts = await db.collection(config.productsCollectionName).find(filterQuery).toArray();
  const filteredProducts = productsList.filter((p) => {
    const oldProduct = oldProducts.find(op => op.url === p.url);
    // if there is a new product in the list or a price of an existing product has been changed
    return !!(!oldProduct || oldProduct && oldProduct.newPrice !== p.newPrice);
  });

  const outOfDateProducts = oldProducts.filter((op) => !!!productsList.find(p => p.url === op.url));

  if (filteredProducts.length) {
    // insert only new or updated products
    const bulk = db.collection(config.productsCollectionName).initializeUnorderedBulkOp();
    filteredProducts.forEach(p => bulk.find({url: p.url}).upsert().updateOne({$set: p}));
    await bulk.execute();
  }

  if (outOfDateProducts.length) {
    // remove out of date products from database
    const bulk = db.collection(config.productsCollectionName).initializeUnorderedBulkOp();
    outOfDateProducts.forEach(p => bulk.find({url: p.url}).removeOne());
    await bulk.execute();
  }

  await client.close();

  return filteredProducts;
};

const sendTelegramNotification = async (insertedProducts) => {
  const message = insertedProducts.map(p => helpers.generateTelegramMessageText(p)).join('\n');
  // send text message with all the products
  await bot.sendMessage(config.telegramChatId, message, {parse_mode: 'HTML'});
};

const sendTelegramMediaGroup = async (insertedProducts) => {
  const message = await Promise.all(insertedProducts.map(async p => {
    const imageRes = await axios(p.img, { responseType: 'arraybuffer' });
    const image = imageRes.data;
    const fileType = await FileType.fromBuffer(image);

    return {
      type: 'photo',
      media: image,
      caption: helpers.generateTelegramMessageText(p),
      parse_mode: 'HTML',
      fileOptions: {
        filename: p.name,
        contentType: fileType.mime,
      }
    }
  }));

  // send text message with all the products
  await bot.sendMediaGroup(config.telegramChatId, message);
};

module.exports = {
  getMongoClient,
  syncProductsCollection,
  sendTelegramNotification,
  sendTelegramMediaGroup
};
