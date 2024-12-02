const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Main bot token
const mainBotToken = '7638229482:AAEHEk2UNOjAyqA3fxKsf9ZliGSI8941gG4';

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

bot.on('polling_error', (error) => {
  console.error('Polling error:', error); // Log the polling error
});

// Listen for new messages and send a random emoji as a reaction
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  // Ensure we only react to group or private messages (ignoring any non-message events)
  if (msg.chat.type === 'private' || msg.chat.type === 'group' || msg.chat.type === 'supergroup' || msg.chat.type === 'channel') {
    // Select a random emoji from the list
    const doEmoji = myEmoji[Math.floor(Math.random() * myEmoji.length)];

    // Send the emoji as a reaction using HTTP POST request
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

      // Create and start the new bot instance for the cloned bot
      const clonedBot = new TelegramBot(token, { polling: true });

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

        // Send emoji as a reaction using setMessageReaction API for cloned bot
        bot.on('polling_error', (error) => {
  console.error('Polling error:', error); // Log the polling error
});

// Listen for new messages and send a random emoji as a reaction
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  // Ensure we only react to group or private messages (ignoring any non-message events)
  if (msg.chat.type === 'private' || msg.chat.type === 'group' || msg.chat.type === 'supergroup' || msg.chat.type === 'channel') {
    // Select a random emoji from the list
    const doEmoji = myEmoji[Math.floor(Math.random() * myEmoji.length)];

    // Send the emoji as a reaction using HTTP POST request
    axios.post(`https://api.telegram.org/bot${token}/setMessageReaction`, {
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

      console.log(`Cloned bot "${botInfo.first_name}" is running...`);
    } else {
      bot.sendMessage(chatId, '❌ Invalid token. Please try again.');
    }
  } catch (error) {
    bot.sendMessage(chatId, '❌ Invalid token or an error occurred. Please try again.');
    console.error("Error in /clone command:", error.message);
  }
});

console.log('Main bot is running...');
