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
const myEmoji = ["👍", "❤️", "🔥", "💯", "😎", "😂", "🤔", "🤩", "🤡", "🎉", "🎵", "💎", "👑", "🦄", "💖", "🌟", "😜", "🎶", "✨", "💥", "🥳", "🌈", "💌", "🙌", "🌍"];

// Function to escape special characters for MarkdownV2
function escapeMarkdownV2(text) {
  return text.replace(/([_*\[\]()~`>#+-=|{}.!])/g, '\\$1');
}

// Command: /start for main bot
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const text = `
*Hey, I am a reaction bot!*\n
Add me to your group/channel to get emoji reactions!\n
To join, click the button below:
  `;

  const escapedText = escapeMarkdownV2(text); // Escape special characters

  bot.sendMessage(chatId, escapedText, {
    parse_mode: 'MarkdownV2',
    reply_markup: {
      inline_keyboard: [
        [{
          text: 'Join 👋',
          url: 'https://t.me/BABY09_WORLD' // Replace with your channel link
        }]
      ]
    }
  }).catch((error) => {
    console.error("Error sending /start message:", error.message);
  });
});

// Polling error handler
bot.on('polling_error', (error) => {
  console.error('Polling error:', error); // Log polling errors
});

// Listen for new messages and send a random emoji as a reaction (Main bot)
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  // Ensure we only react to group or private messages (ignoring any non-message events)
  if (msg.chat.type === 'private' || msg.chat.type === 'group' || msg.chat.type === 'supergroup' || msg.chat.type === 'channel') {
    // Select a random emoji from the list
    const doEmoji = myEmoji[Math.floor(Math.random() * myEmoji.length)];

    // Send the emoji as a reaction using Telegram API
    axios.post(`https://api.telegram.org/bot${mainBotToken}/setMessageReaction`, {
      chat_id: chatId,
      message_id: messageId,
      reaction: JSON.stringify([
        {
          type: "emoji",
          emoji: doEmoji,
          is_big: true // Optional: To make the reaction big (true/false)
        }
      ])
    })
    .then(response => {
      console.log(`Reacted with ${doEmoji} to message: ${msg.text}`);
    })
    .catch(error => {
      console.error(`Error reacting with emoji: ${error}`);
    });
  }
});

// Command: /clone <bot_token> (For Cloning Bots)
bot.onText(/\/clone (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const token = match[1].trim();

  try {
    // Validate the provided bot token
    const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    if (response.data.ok) {
      const botInfo = response.data.result;

      bot.sendMessage(chatId, `✅ Token is valid! Bot "${botInfo.first_name}" is starting...`);

      // Store the bot token in MongoDB
      const newBotToken = new BotToken({
        botName: botInfo.first_name,
        token: token
      });
      await newBotToken.save();

      console.log(`Stored bot token for "${botInfo.first_name}" in MongoDB`);

      // Retrieve the bot token from MongoDB
      const storedBot = await BotToken.findOne({ botName: botInfo.first_name });
      if (storedBot) {
        // Create and start the new bot instance for the cloned bot
        const clonedBot = new TelegramBot(storedBot.token, { polling: true });

        // Command: /start for the cloned bot
        clonedBot.onText(/\/start/, (msg) => {
          const chatId = msg.chat.id;
          const text = `Hi, I am a cloned bot of *${botInfo.first_name}*! \n\nI will react to your messages with random emojis.`;

          const escapedText = escapeMarkdownV2(text); // Escape special characters

          clonedBot.sendMessage(chatId, escapedText, {
            parse_mode: 'MarkdownV2'
          }).catch((error) => {
            console.error("Error sending /start message for cloned bot:", error.message);
          });
        });

        // Add reaction logic for the cloned bot
        clonedBot.on('message', (msg) => {
          const clonedChatId = msg.chat.id;
          const clonedMessageId = msg.message_id;

          // Skip if message is a command or non-reaction message
          if (msg.text && msg.text.startsWith('/')) return;

          // Select a random emoji from the list
          const clonedEmoji = myEmoji[Math.floor(Math.random() * myEmoji.length)];

          // Send emoji reaction for cloned bot
          axios.post(`https://api.telegram.org/bot${storedBot.token}/setMessageReaction`, {
            chat_id: clonedChatId,
            message_id: clonedMessageId,
            reaction: JSON.stringify([
              {
                type: "emoji",
                emoji: clonedEmoji,
                is_big: true // Optional: To make the reaction big (true/false)
              }
            ])
          })
          .then(response => {
            console.log(`Cloned bot reacted with ${clonedEmoji} to message: ${msg.text}`);
          })
          .catch(error => {
            console.error(`Error reacting with emoji in cloned bot: ${error}`);
          });
        });

        console.log(`Cloned bot "${botInfo.first_name}" is running...`);
      } else {
        console.log('No token found for the cloned bot.');
      }
    } else {
      bot.sendMessage(chatId, '❌ Invalid token. Please try again.');
    }
  } catch (error) {
    bot.sendMessage(chatId, '❌ Invalid token or an error occurred. Please try again.');
    console.error("Error in /clone command:", error.message);
  }
});

console.log('Main bot is running...');
