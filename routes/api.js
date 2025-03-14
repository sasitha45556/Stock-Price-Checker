'use strict';
const axios = require('axios');
const mongoose = require('mongoose');
const { Stock } = require('../models/stock');
const requestAndReturnData = require('../controllers/requestAndReturnData');
const requester = new requestAndReturnData();

module.exports = function (app) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      let requestersIp = req.ip;
      console.log(requestersIp);

      let { stock, like } = req.query;
      console.log(stock);
      console.log(like);

      // For handling multiple stocks
      if (Array.isArray(stock)) {
        console.log(stock + ' stock when we send an array');
        let [stock1, stock2] = stock; // Destructure stocks
        console.log(stock1 + ' stock 1 at beginning');
        console.log(stock2 + ' at the beginning');

        let symbol1, price1, symbol2, price2;
        let data1 = await requester.requestData(stock1);
        let data2 = await requester.requestData(stock2);
        symbol1 = data1.symbol;
        price1 = data1.price;
        symbol2 = data2.symbol;
        price2 = data2.price;

        let stock1FromDB = await Stock.findOne({ stockName: symbol1 }).exec();
        let stock2FromDB = await Stock.findOne({ stockName: symbol2 }).exec();

        if (!stock1FromDB) {
          stock1FromDB = new Stock({
            stockName: symbol1,
            likes: 0
          });
          stock1FromDB.ipAdresses.push(requestersIp);
          if (like === true) {
            stock1FromDB.likes++;
          }
          try {
            await stock1FromDB.save();
          } catch (err) {
            console.error('Error saving stock1FromDB:', err);
          }
        }

        if (!stock2FromDB) {
          stock2FromDB = new Stock({
            stockName: symbol2,
            likes: 0
          });
          stock2FromDB.ipAdresses.push(requestersIp);
          if (like === true) {
            stock2FromDB.likes++;
          }
          try {
            await stock2FromDB.save();
          } catch (err) {
            console.error('Error saving stock2FromDB:', err);
          }
        }

        if (like) {
          if (!stock1FromDB.ipAdresses.includes(requestersIp)) {
            stock1FromDB.likes++;
            try {
              await stock1FromDB.save();
            } catch (err) {
              console.error('Error saving stock1FromDB after incrementing likes:', err);
            }
          } else {
            console.log(`${requestersIp} ipAdress already liked this so blocked!!`);
          }

          if (!stock2FromDB.ipAdresses.includes(requestersIp)) {
            stock2FromDB.likes++;
            try {
              await stock2FromDB.save();
            } catch (err) {
              console.error('Error saving stock2FromDB after incrementing likes:', err);
            }
          } else {
            console.log(`${requestersIp} ipAdress already liked this so blocked!!`);
          }
        }

        return res.send({
          stockData: [
            {
              stock: symbol1,
              price: price1,
              rel_likes: stock1FromDB.likes - stock2FromDB.likes
            },
            {
              stock: symbol2,
              price: price2,
              rel_likes: stock2FromDB.likes - stock1FromDB.likes
            }
          ]
        });
      }

      // For handling a single stock
      let symbol, price;
      let data = await requester.requestData(stock);
      symbol = data.symbol;
      price = data.price;

      let stockFromDB = await Stock.findOne({ stockName: symbol }).exec();
      if (!stockFromDB) {
        stockFromDB = new Stock({
          stockName: symbol,
          likes: 0
        });
        stockFromDB.ipAdresses.push(requestersIp);
        if (like === true) {
          stockFromDB.likes++;
        }
        try {
          await stockFromDB.save();
        } catch (err) {
          console.error('Error saving stockFromDB:', err);
        }
        return res.send({
          stockData: {
            stock: symbol,
            price: price,
            likes: stockFromDB.likes
          }
        });
      }

      if (like && !stockFromDB.ipAdresses.includes(requestersIp)) {
        stockFromDB.likes++;
        try {
          await stockFromDB.save();
        } catch (err) {
          console.error('Error saving stockFromDB after incrementing likes:', err);
        }
      } else if (like) {
        console.log(`${requestersIp} ipAdress already liked this so blocked!!`);
      }

      res.send({
        stockData: {
          stock: symbol,
          price: price,
          likes: stockFromDB.likes
        }
      });
    });
};
