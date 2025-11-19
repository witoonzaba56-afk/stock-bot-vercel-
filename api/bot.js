const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const NodeCache = require('node-cache');

// ตั้งค่า cache (5 นาที)
const cache = new NodeCache({ stdTTL: 300 });

// ตรวจสอบ BOT_TOKEN
if (!process.env.BOT_TOKEN) {
  throw new Error('BOT_TOKEN environment variable is required');
}

const bot = new Telegraf(process.env.BOT_TOKEN);

class AdvancedSupportResistance {
  constructor() {
    this.periods = [20, 50, 200];
  }

  calculateAdvancedLevels(high, low, close) {
    const pivotLevels = this.calculatePivotPoints(high, low, close);
    const fibLevels = this.calculateFibonacciLevels(high, low);
    const maLevels = this.getMovingAverageLevels(close);
    const psychLevels = this.getPsychologicalLevels(close);
    
    return this.combineAndScoreLevels(
      pivotLevels, fibLevels, maLevels, psychLevels, close
    );
  }

  calculatePivotPoints(high, low, close) {
    const pivot = (high + low + close) / 3;
    const r1 = (2 * pivot) - low;
    const s1 = (2 * pivot) - high;
    const r2 = pivot + (high - low);
    const s2 = pivot - (high - low);
    const r3 = high + 2 * (pivot - low);
    const s3 = low - 2 * (high - pivot);
    
    return {
      pivot: this.round(pivot),
      resistance: [this.round(r1), this.round(r2), this.round(r3)],
      support: [this.round(s1), this.round(s2), this.round(s3)]
    };
  }

  calculateFibonacciLevels(high, low) {
    const diff = high - low;
    return {
      fib_236: this.round(high - (0.236 * diff)),
      fib_382: this.round(high - (0.382 * diff)),
      fib_500: this.round(high - (0.5 * diff)),
      fib_618: this.round(high - (0.618 * diff)),
      fib_786: this.round(high - (0.786 * diff))
    };
  }

  getMovingAverageLevels(closePrices) {
    if (typeof closePrices === 'number') {
      return {
        MA20: this.round(closePrices * 0.99),
        MA50: this.round(closePrices * 0.98),
        MA200: this.round(closePrices * 0.96)
      };
    }
    return {};
  }

  getPsychologicalLevels(currentPrice) {
    const base = Math.round(currentPrice);
    return {
      psych_00_below: base - 1,
      psych_50_below: base - 0.5,
      psych_00: base,
      psych_50: base + 0.5,
      psych_00_above: base + 1
    };
  }

  combineAndScoreLevels(pivotLevels, fibLevels, maLevels, psychLevels, currentPrice) {
    const levelScores = {};

    // Pivot Points
    pivotLevels.support.forEach((level, i) => {
      levelScores[`pivot_s${i+1}`] = { price: level, score: 5 - i };
    });
    pivotLevels.resistance.forEach((level, i) => {
      levelScores[`pivot_r${i+1}`] = { price: level, score: 5 - i };
    });

    // Fibonacci
    const fibWeights = { fib_618: 4, fib_500: 3, fib_382: 3, fib_786: 2, fib_236: 2 };
    Object.entries(fibWeights).forEach(([key, weight]) => {
      levelScores[key] = { price: fibLevels[key], score: weight };
    });

    // Moving Averages
    const maWeights = { MA20: 3, MA50: 2, MA200: 4 };
    Object.entries(maWeights).forEach(([key, weight]) => {
      if (maLevels[key]) {
        levelScores[key] = { price: maLevels[key], score: weight };
      }
    });

    // Psychological Levels
    const psychWeights = { psych_00: 3, psych_50: 2, psych_00_above: 1, psych_00_below: 1, psych_50_below: 1 };
    Object.entries(psychWeights).forEach(([key, weight]) => {
      levelScores[key] = { price: psychLevels[key], score: weight };
    });

    return this.clusterLevels(levelScores, currentPrice);
  }

  clusterLevels(levelScores, currentPrice, thresholdPercent = 1.0) {
    const threshold = currentPrice * (thresholdPercent / 100);
    const supportLevels = [];
    const resistanceLevels = [];

    Object.entries(levelScores).forEach(([levelName, data]) => {
      const price = data.price;
      const score = data.score;

      if (price < currentPrice) {
        let foundCluster = false;
        for (const cluster of supportLevels) {
          if (Math.abs(cluster.price - price) <= threshold) {
            cluster.strength += score;
            cluster.sources.push(levelName);
            foundCluster = true;
            break;
          }
        }
        if (!foundCluster) {
          supportLevels.push({
            price: price,
            strength: score,
            sources: [levelName]
          });
        }
      } else {
        let foundCluster = false;
        for (const cluster of resistanceLevels) {
          if (Math.abs(cluster.price - price) <= threshold) {
            cluster.strength += score;
            cluster.sources.push(levelName);
            foundCluster = true;
            break;
          }
        }
        if (!foundCluster) {
          resistanceLevels.push({
            price: price,
            strength: score,
            sources: [levelName]
          });
        }
      }
    });

    // เรียงลำดับ
    supportLevels.sort((a, b) => b.price - a.price);
    resistanceLevels.sort((a, b) => a.price - b.price);

    const topSupport = supportLevels
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3)
      .sort((a, b) => b.price - a.price);

    const topResistance = resistanceLevels
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3)
      .sort((a, b) => a.price - b.price);

    return {
      support: topSupport,
      resistance: topResistance
    };
  }

  round(value) {
    return Math.round(value * 100) / 100;
  }
}

class HybridStockAPI {
  constructor() {
    this.yahooHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    this.srCalculator = new AdvancedSupportResistance();
  }

  async getStockData(symbol) {
    try {
      const yahooData = await this.getYahooFinanceData(symbol);
      if (!yahooData) return null;

      return yahooData;
    } catch (error) {
      console.error('Hybrid API error:', error);
      return null;
    }
  }

  async getYahooFinanceData(symbol) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const params = {
        range: '3mo',
        interval: '1d'
      };

      const response = await axios.get(url, { 
        params, 
        headers: this.yahooHeaders, 
        timeout: 15000 
      });

      if (response.status !== 200) return null;

      const data = response.data;
      if (!data.chart?.result?.[0]) return null;

      const result = data.chart.result[0];
      const meta = result.meta;

      const currentPrice = meta.regularMarketPrice || 0;
      const previousClose = meta.previousClose || 0;
      const change = currentPrice - previousClose;
      const changePct = previousClose ? (change / previousClose) * 100 : 0;

      const indicators = result.indicators?.quote?.[0] || {};
      const highs = indicators.high || [];
      const lows = indicators.low || [];
      const closes = indicators.close || [];

      const validHighs = highs.filter(h => h !== null);
      const validLows = lows.filter(l => l !== null);
      const validCloses = closes.filter(c => c !== null);

      let recentHigh, recentLow, recentClose;
      if (!validHighs.length || !validLows.length || !validCloses.length) {
        recentHigh = currentPrice * 1.05;
        recentLow = currentPrice * 0.95;
        recentClose = currentPrice;
      } else {
        recentHigh = Math.max(...validHighs.slice(-20));
        recentLow = Math.min(...validLows.slice(-20));
        recentClose = validCloses[validCloses.length - 1];
      }

      const supportResistance = this.calculateAdvancedSupportResistance(
        recentHigh, recentLow, recentClose, currentPrice
      );

      return {
        current_price: currentPrice,
        previous_close: previousClose,
        change: change,
        change_pct: changePct,
        company_name: meta.longName || symbol,
        exchange: meta.exchangeName || '',
        currency: meta.currency || 'USD',
        volume: meta.regularMarketVolume || 0,
        market_cap: meta.marketCap || 0,
        day_high: meta.regularMarketDayHigh || 0,
        day_low: meta.regularMarketDayLow || 0,
        support_levels: supportResistance.support.map(level => level.price),
        resistance_levels: supportResistance.resistance.map(level => level.price),
        support_strength: supportResistance.support.map(level => level.strength),
        resistance_strength: supportResistance.resistance.map(level => level.strength),
        data_source: 'Yahoo Finance'
      };
    } catch (error) {
      console.error('Yahoo Finance error:', error);
      return null;
    }
  }

  calculateAdvancedSupportResistance(high, low, close, currentPrice) {
    try {
      return this.srCalculator.calculateAdvancedLevels(high, low, close);
    } catch (error) {
      console.error('Advanced support resistance error:', error);
      return this.calculateBasicLevels(currentPrice);
    }
  }

  calculateBasicLevels(currentPrice) {
    return {
      support: [
        { price: this.round(currentPrice * 0.98), strength: 2, sources: ['basic'] },
        { price: this.round(currentPrice * 0.96), strength: 1, sources: ['basic'] },
        { price: this.round(currentPrice * 0.94), strength: 1, sources: ['basic'] }
      ],
      resistance: [
        { price: this.round(currentPrice * 1.02), strength: 2, sources: ['basic'] },
        { price: this.round(currentPrice * 1.04), strength: 1, sources: ['basic'] },
        { price: this.round(currentPrice * 1.06), strength: 1, sources: ['basic'] }
      ]
    };
  }

  round(value) {
    return Math.round(value * 100) / 100;
  }
}

// Utility functions
function getStrengthIcon(strength) {
  if (strength >= 8) return "🟢🔴";
  if (strength >= 5) return "🟢";
  if (strength >= 3) return "🟡";
  return "⚪";
}

function formatCurrency(value, currency) {
  try {
    if (currency === "THB") return `฿${value.toFixed(2)}`;
    if (currency === "JPY") return `¥${Math.round(value)}`;
    if (currency === "EUR") return `€${value.toFixed(2)}`;
    if (currency === "GBP") return `£${value.toFixed(2)}`;
    return `$${value.toFixed(2)}`;
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

function formatMarketCap(marketCap) {
  try {
    if (!marketCap || marketCap === 0) return "N/A";
    if (marketCap >= 1e12) return `${(marketCap/1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `${(marketCap/1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `${(marketCap/1e6).toFixed(2)}M`;
    return marketCap.toLocaleString();
  } catch {
    return "N/A";
  }
}

function formatSupportResistanceDisplay(levels, currentPrice, currency) {
  let result = "";
  
  result += "🛡️ *แนวรับ (Support)*\n";
  if (levels.support.length) {
    levels.support.forEach((level, i) => {
      const strengthIcon = getStrengthIcon(level.strength);
      const distancePct = ((currentPrice - level.price) / currentPrice) * 100;
      result += `├ ${strengthIcon} ระดับ ${i+1}: ${formatCurrency(level.price, currency)} `;
      result += `(${distancePct.toFixed(1)}%)\n`;
    });
  } else {
    result += "├ ⚪ ไม่พบแนวรับชัดเจน\n";
  }
  
  result += "⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n";
  
  result += "🎯 *แนวต้าน (Resistance)*\n";
  if (levels.resistance.length) {
    levels.resistance.forEach((level, i) => {
      const strengthIcon = getStrengthIcon(level.strength);
      const distancePct = ((level.price - currentPrice) / currentPrice) * 100;
      result += `├ ${strengthIcon} ระดับ ${i+1}: ${formatCurrency(level.price, currency)} `;
      result += `(${distancePct.toFixed(1)}%)\n`;
    });
  } else {
    result += "├ ⚪ ไม่พบแนวต้านชัดเจน\n";
  }
  
  return result;
}

// สร้าง instances
const hybridAPI = new HybridStockAPI();

// Telegram Bot Handlers
bot.start((ctx) => {
  const welcomeText = `
🎯 *บอทวิเคราะห์หุ้น - Yahoo Finance* 📱

*🚀 ระบบวิเคราะห์หุ้น:*
• 📊 Yahoo Finance - ข้อมูลพื้นฐาน + แนวรับแนวต้านแบบไฮบริด
• 🛡️ แนวรับ-แนวต้านแบบไฮบริด (Pivot + Fibonacci + MA + Psychological)

*✨ ข้อมูลที่ได้รับ:*
• ราคาเรียลไทม์และเปลี่ยนแปลง
• แนวรับ-แนวต้านแบบไฮบริด
• มูลค่าตลาดและ Volume
• ข้อมูลบริษัท

*📋 วิธีการใช้งาน:*
พิมพ์สัญลักษณ์หุ้นเลย!
• 🏢 AAPL, TSLA, PTT.BK
• 📊 SPY, QQQ, VOO
• ₿ BTC-USD, ETH-USD

📍 *เริ่มต้นเลยโดยพิมพ์สัญลักษณ์หุ้น!*
`;
  ctx.reply(welcomeText, { parse_mode: 'Markdown' });
});

bot.help((ctx) => {
  const helpText = `
📚 *คู่มือการใช้งาน*

*คำสั่งที่ใช้งานได้:*
/start - เริ่มต้นใช้งาน
/help - แสดงคู่มือนี้
/world - ดัชนีตลาดโลก
/search [คำค้น] - ค้นหาหุ้น

*ตัวอย่างการใช้งาน:*
• พิมพ์ \`AAPL\` เพื่อวิเคราะห์ Apple
• พิมพ์ \`PTT.BK\` สำหรับหุ้นไทย
• พิมพ์ \`BTC-USD\` สำหรับ Bitcoin
`;
  ctx.reply(helpText, { parse_mode: 'Markdown' });
});

bot.command('world', async (ctx) => {
  try {
    const loadingMsg = await ctx.reply("🌍 *กำลังโหลดดัชนีโลก...*", { parse_mode: 'Markdown' });
    
    const indices = {
      '^GSPC': 'S&P 500 (US)',
      '^DJI': 'Dow Jones (US)', 
      '^IXIC': 'NASDAQ (US)',
      '^FTSE': 'FTSE 100 (UK)',
      '^N225': 'Nikkei 225 (Japan)',
      '^HSI': 'Hang Seng (HK)',
      '^SET.BK': 'SET Index (Thailand)'
    };
    
    let response = "🌐 *ดัชนีตลาดโลก*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n";
    let successfulCount = 0;
    
    for (const [symbol, name] of Object.entries(indices)) {
      const data = await hybridAPI.getStockData(symbol);
      if (data && data.current_price > 0) {
        successfulCount++;
        const arrow = data.change >= 0 ? "🟢" : "🔴";
        const trend = data.change >= 0 ? "📈" : "📉";
        response += `${trend} *${name}*\n`;
        response += `${arrow} ${formatCurrency(data.current_price, data.currency)} `;
        response += `(${data.change_pct > 0 ? '+' : ''}${data.change_pct.toFixed(2)}%)\n\n`;
      }
    }
    
    if (successfulCount === 0) {
      response = "❌ *ไม่สามารถโหลดข้อมูลดัชนีได้ในขณะนี้*";
    }
    
    await ctx.telegram.editMessageText(
      ctx.chat.id, 
      loadingMsg.message_id, 
      null, 
      response, 
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    ctx.reply("❌ *เกิดข้อผิดพลาดในการโหลดดัชนี*");
  }
});

bot.command('search', async (ctx) => {
  try {
    const query = ctx.message.text.split(' ').slice(1).join(' ');
    if (!query) {
      return ctx.reply("❌ *รูปแบบคำสั่ง:* `/search [ชื่อ]`\nตัวอย่าง: `/search Apple`", { parse_mode: 'Markdown' });
    }
    
    const loadingMsg = await ctx.reply(`🔍 *กำลังค้นหา '${query}'...*`, { parse_mode: 'Markdown' });
    
    const url = `https://query1.finance.yahoo.com/v1/finance/search`;
    const params = { q: query, quotesCount: 6, newsCount: 0 };
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };
    
    const response = await axios.get(url, { params, headers, timeout: 10000 });
    const data = response.data;
    
    if (!data.quotes || !data.quotes.length) {
      return ctx.telegram.editMessageText(
        ctx.chat.id,
        loadingMsg.message_id,
        null,
        `❌ *ไม่พบผลลัพธ์สำหรับ '${query}'*`,
        { parse_mode: 'Markdown' }
      );
    }
    
    let resultText = `✨ *ผลการค้นหา: '${query}'*\n\n`;
    
    data.quotes.slice(0, 6).forEach((stock, i) => {
      const symbol = stock.symbol || '';
      const name = stock.longname || stock.shortname || '';
      const exchange = stock.exchDisp || '';
      
      resultText += `*${i+1}. 🏢 ${symbol}*\n`;
      resultText += `   🏢 ${name}\n`;
      resultText += `   📍 ${exchange}\n\n`;
    });
    
    resultText += "_พิมพ์สัญลักษณ์เพื่อดูข้อมูลเต็ม_";
    
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      loadingMsg.message_id,
      null,
      resultText,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    ctx.reply("❌ *เกิดข้อผิดพลาดในการค้นหา*");
  }
});

// Handle stock symbols
bot.on('text', async (ctx) => {
  const symbol = ctx.message.text.toUpperCase().trim();
  
  // Skip if it's a command
  if (symbol.startsWith('/')) return;
  
  try {
    const loadingMsg = await ctx.reply(`⏳ *กำลังวิเคราะห์ ${symbol}...*`, { parse_mode: 'Markdown' });
    
    // ตรวจสอบ cache
    const cacheKey = `stock_${symbol}`;
    let stockData = cache.get(cacheKey);
    
    if (!stockData) {
      stockData = await hybridAPI.getStockData(symbol);
      if (stockData) {
        cache.set(cacheKey, stockData);
      }
    }
    
    if (!stockData || stockData.current_price === 0) {
      return ctx.telegram.editMessageText(
        ctx.chat.id,
        loadingMsg.message_id,
        null,
        `❌ *ไม่พบข้อมูลสำหรับ '${symbol}'*\n\n💡 *ข้อแนะนำ:*\n• ตรวจสอบสัญลักษณ์ให้ถูกต้อง\n• ตลาดไทยต้องมี .BK (เช่น PTT.BK)\n• ใช้ \`/search [ชื่อ]\` ค้นหา`,
        { parse_mode: 'Markdown' }
      );
    }
    
    const {
      current_price,
      change,
      change_pct,
      company_name,
      exchange,
      currency,
      volume,
      market_cap,
      day_high,
      day_low,
      support_levels,
      resistance_levels,
      support_strength,
      resistance_strength
    } = stockData;
    
    const supportLevels = support_levels.map((price, i) => ({
      price,
      strength: support_strength[i] || 1
    }));
    
    const resistanceLevels = resistance_levels.map((price, i) => ({
      price,
      strength: resistance_strength[i] || 1
    }));
    
    const result = `
🏢 *${symbol} - ${company_name}*
📍 *ตลาด:* ${exchange} | 💰 *สกุลเงิน:* ${currency}
⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯

💹 *ข้อมูลราคา*
├ 💰 ราคาปัจจุบัน: ${formatCurrency(current_price, currency)}
├ 📊 เปลี่ยนแปลง: ${formatCurrency(change, currency)} (${change_pct > 0 ? '+' : ''}${change_pct.toFixed(2)}%)
├ 📈 สูงสุดวัน: ${formatCurrency(day_high, currency)}
├ 📉 ต่ำสุดวัน: ${formatCurrency(day_low, currency)}
└ 💼 มูลค่าตลาด: ${formatMarketCap(market_cap)}

📊 *ข้อมูลพื้นฐาน*
└ 📦 Volume: ${volume.toLocaleString()}

${formatSupportResistanceDisplay(
  { support: supportLevels, resistance: resistanceLevels },
  current_price, 
  currency
)}

💡 *คำแนะนำ:* ${change_pct >= 0 ? '🟢 พิจารณาซื้อ/ถือต่อ' : '🔴 ระวัง/ลดพอร์ต'}

⏰ *อัพเดท:* ${new Date().toLocaleString('th-TH')}

_ใช้ /help เพื่อดูคำสั่งทั้งหมด_
`;
    
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      loadingMsg.message_id,
      null,
      result,
      { parse_mode: 'Markdown' }
    );
    
  } catch (error) {
    console.error('Error handling message:', error);
    try {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        loadingMsg.message_id,
        null,
        `❌ *เกิดข้อผิดพลาดในการวิเคราะห์ ${symbol}*\n\nโปรดลองอีกครั้งในภายหลัง`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      ctx.reply(`❌ *เกิดข้อผิดพลาดในการวิเคราะห์ ${symbol}*`);
    }
  }
});

// Vercel Serverless Function Handler
module.exports = async (req, res) => {
  // ตั้งค่า CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('Error handling update:', error);
      res.status(500).json({ status: 'error', error: error.message });
    }
  } else {
    res.status(200).json({ 
      status: 'running', 
      message: 'Telegram Stock Bot is running on Vercel',
      timestamp: new Date().toISOString()
    });
  }
};
