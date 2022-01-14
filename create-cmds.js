const { config } = require("dotenv");
config();

const { REST } = require("@discordjs/rest");
const {
  Routes,
  ApplicationCommandOptionType,
} = require("discord-api-types/v9");

const commands = [
  {
    name: "subscribe",
    description: "Subscribe to a search URL",
    options: [
      {
        name: "url",
        description: "The Vinted search URL",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "channel",
        description: "The room where you want to send the notifications",
        type: ApplicationCommandOptionType.Channel,
        required: true,
      },
    ],
  },
  {
    name: "unsubscribe",
    description: "Unsubscribe from a search URL",
    options: [
      {
        name: "id",
        description: "The subscription identifier (/ subscriptions)",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
  {
    name: "subscriptions",
    description: "Access the list of all your subscriptions",
    options: [],
  },
];

const rest = new REST({ version: "9" }).setToken(process.env.VINTED_BOT_TOKEN);

(async () => {
  try {
    const { id: userId, username } = await rest.get(Routes.user());

    console.log(`👋 Connected as ${username}!`);

    const [{ id: guildId, name: guildName }] = await rest.get(
      Routes.userGuilds()
    );

    console.log(`💻 Connected to ${guildName}!`);

    await rest
      .put(Routes.applicationGuildCommands(userId, guildId), { body: commands })
      .then(console.log);

    console.log(`💻 Commands have been registered on ${guildName}!`);
  } catch (error) {
    console.error("error : ", error);
  }
})();
