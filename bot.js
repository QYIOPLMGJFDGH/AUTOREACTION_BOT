const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const mongoose = require('mongoose');

// Main bot token
const mainBotToken = '7638229482:AAEHEk2UNOjAyqA3fxKsf9ZliGSI8941gG4';

// MongoDB connection
mongoose.connect('mongodb+srv://Yash_607:Yash_607@cluster0.r3s9sbo.mongodb.net/?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// MongoDB Schema for storing bot tokens
const botTokenSchema = new mongoose.Schema({
  botName: String,
  token: String
});

const BotToken = mongoose.model('BotToken', botTokenSchema);

// Main bot instance
const bot = new TelegramBot(mainBotToken, { polling: true });

// List of unique emojis for reactions
const myEmoji = ["👍", "❤️", "🔥", "💯", "😎", "😂", "🤔", "🤩", "🤡", "🎉", "💖", "🤯", "🤗", "😜", "🧐", "👻", "🥳", "🥸", "😢", "🥵", "🫣"];

// Function to escape special characters for MarkdownV2
function escapeMarkdownV2(text) {
  return text.replace(/([_*\[\]()~`>#+-=|{}.!])/g, '\\$1');
}

// Command: /start for main bot
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const text = `*Hey, I am a reaction bot!*\n\nAdd me to your group/channel to get emoji reactions!\nTo join, click the button below:`;

  const escapedText = escapeMarkdownV2(text);

  bot.sendMessage(chatId, escapedText, {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: [
        [{
          text: 'Join 👋',
          url: 'https://t.me/YOUR_CHANNEL_LINK' // Replace with your channel link
        }]
      ]
    }
  }).catch((error) => {
    console.error("Error sending /start message:", error.message);
  });
});

// Polling error handler
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Listen for new messages and send a random emoji as a reaction
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  if (['private', 'group', 'supergroup', 'channel'].includes(msg.chat.type)) {
    const randomEmoji = myEmoji[Math.floor(Math.random() * myEmoji.length)];

    axios.post(`https://api.telegram.org/bot${mainBotToken}/sendMessage`, {
      chat_id: chatId,
      text: randomEmoji,
      reply_to_message_id: messageId
    })
    .then(() => {
      console.log(`Reacted with ${randomEmoji} to message: ${msg.text}`);
    })
    .catch(error => {
      console.error(`Error reacting with emoji: ${error.message}`);
    });
  }
});

// Function to start cloned bots
// Function to start cloned bots
async function startClonedBots() {
  try {
    // Fetch unique bot tokens from MongoDB
    const storedBots = await BotToken.aggregate([
      { $group: { _id: "$token", botName: { $first: "$botName" } } }
    ]);

    storedBots.forEach(botData => {
      const clonedBot = new TelegramBot(botData._id, { polling: true });

      // Command: /start for the cloned bot
      clonedBot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const text = `Hi, I am a cloned bot of *${botData.botName}*! \n\nI will react to your messages with random emojis.`;

        const escapedText = escapeMarkdownV2(text);

        clonedBot.sendMessage(chatId, escapedText, { parse_mode: 'MarkdownV2' })
          .catch(error => console.error("Error sending /start message for cloned bot:", error.message));
      });

      // Add reaction logic for the cloned bot
      clonedBot.on('message', (msg) => {
        const randomEmoji = myEmoji[Math.floor(Math.random() * myEmoji.length)];
        clonedBot.sendMessage(msg.chat.id, randomEmoji, { reply_to_message_id: msg.message_id })
          .catch(error => console.error("Error reacting in cloned bot:", error.message));
      });

      // Polling error handler for cloned bots
      clonedBot.on('polling_error', (error) => {
        console.error(`Cloned bot polling error for "${botData.botName}":`, error);
      });

      console.log(`Cloned bot "${botData.botName}" is running...`);
    });
  } catch (error) {
    console.error("Error starting cloned bots:", error.message);
  }
}

// Start all cloned bots
startClonedBots();

// Command: /clone <bot_token>
bot.onText(/\/clone (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const token = match[1].trim();

  try {
    const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    if (response.data.ok) {
      const botInfo = response.data.result;

      bot.sendMessage(chatId, `✅ Token is valid! Bot "${botInfo.first_name}" is starting...`);

      const newBotToken = new BotToken({
        botName: botInfo.first_name,
        token: token
      });
      await newBotToken.save();

      console.log(`Stored bot token for "${botInfo.first_name}" in MongoDB`);
      startClonedBots();
    } else {
      bot.sendMessage(chatId, '❌ Invalid token. Please try again.');
    }
  } catch (error) {
    bot.sendMessage(chatId, '❌ Invalid token or an error occurred. Please try again.');
    console.error("Error in /clone command:", error.message);
  }
});

console.log('Main bot is running...');
