const { config } = require("dotenv");
config();
import Discord, { TextChannel, Intents } from "discord.js";
const client = new Discord.Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_TYPING,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_BANS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGE_TYPING,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_WEBHOOKS,
    Intents.FLAGS.GUILD_PRESENCES,
  ],
});

import vinted from "vinted-api";
import { initialize, Subscription } from "./database";
import { getConnection } from "typeorm";

const adminIDs = process.env.VINTED_BOT_ADMIN_IDS?.split(",")!;

let isFirstSync = true;
let lastFetchFinished = true;

initialize();

const syncSubscription = (subscriptionData: Subscription) => {
  return new Promise<void>((resolve) => {
    vinted
      .search(subscriptionData.url, false, false, {
        per_page: "20",
      })
      .then((res) => {
        if (!res.items) {
          console.log(
            "Search done bug got wrong response. Promise resolved.",
            res
          );
          resolve();
          return;
        }
        const lastItemTimestamp = subscriptionData.latestItemDate?.getTime();
        const items = res.items
          .sort(
            (a, b) =>
              new Date(b.created_at_ts).getTime() -
              new Date(a.created_at_ts).getTime()
          )
          .filter(
            (item) =>
              !lastItemTimestamp ||
              new Date(item.created_at_ts).getTime() > lastItemTimestamp
          );

        if (!items.length) return void resolve();

        const newLastItemDate = new Date(items[0].created_at_ts);
        if (
          !lastItemTimestamp ||
          newLastItemDate.getTime() > lastItemTimestamp
        ) {
          getConnection().manager.getRepository(Subscription).update(
            {
              id: subscriptionData.id,
            },
            {
              latestItemDate: newLastItemDate,
            }
          );
        }

        const itemsToSend =
          lastItemTimestamp && !isFirstSync ? items.reverse() : [items[0]];

        for (let item of itemsToSend) {
          const embed = new Discord.MessageEmbed()
            .setTitle(item.title)
            .setURL(`https://www.vinted.fr${item.path}`)
            .setImage(item.photos[0]?.url)
            .setColor("#09B1BA")
            .setTimestamp(new Date(item.created_at_ts))
            .setFooter(`Research related article : ${subscriptionData.id}`)
            .addField("Price", item.price || "vide", true)
            .addField("Condition", item.status || "vide", true)
            .addField("Cut", item.size || "vide", true)
            .addField(
              "seller rating",
              `${getReputationStars(item.user.feedback_reputation)} (${
                (item.user.positive_feedback_count || 0) +
                (item.user.neutral_feedback_count || 0) +
                (item.user.negative_feedback_count || 0)
              })` || "vide",
              true
            )
            .addField(
              "Country and City",
              `:flag_${item.user.country_iso_code.toLowerCase()}: ${
                item.city
              }` || "vide",
              true
            );
          (
            client.channels.cache.get(subscriptionData.channelId) as TextChannel
          ).send({
            embeds: [embed],
            components: [
              new Discord.MessageActionRow().addComponents([
                new Discord.MessageButton()
                  .setLabel("Details")
                  .setURL(item.url)
                  .setEmoji("🔎")
                  .setStyle("LINK"),
                new Discord.MessageButton()
                  .setLabel("Purchase Now")
                  .setURL(
                    `https://www.vinted.fr/transaction/buy/new?source_screen=item&transaction%5Bitem_id%5D=${item.id}`
                  )
                  .setEmoji("💸")
                  .setStyle("LINK"),
              ]),
            ],
          });
        }

        if (itemsToSend.length > 0) {
          console.log(
            `👕 ${itemsToSend.length} ${
              itemsToSend.length > 1 ? "new items found" : "new article found"
            } for research ${subscriptionData.id} !\n`
          );
        }

        resolve();
      })
      .catch((e) => {
        console.error("Search returned an error. Promise resolved.", e);
        resolve();
      });
  });
};

const sync = async () => {
  if (!lastFetchFinished) return;
  lastFetchFinished = false;

  setTimeout(() => {
    lastFetchFinished = true;
  }, 20_000);

  console.log(`🤖 Synced to Vinted...\n`);

  const subscriptions = await getConnection()
    .manager.getRepository(Subscription)
    .find({
      isActive: true,
    });
  const promises = subscriptions.map((sub) => syncSubscription(sub));
  Promise.all(promises).then(() => {
    isFirstSync = false;
    lastFetchFinished = true;
  });
};

client.on("ready", () => {
  console.log(`🔗 Connected to the account of ${client.user!.tag} !\n`);

  isFirstSync = true;

  const messages = [
    `🕊️ This free and free project takes time. If you have the means, do not hesitate to support the development with a donation ! https://paypal.me/andr0z\n`,
    `🤟 Did you know ? We offer our own version of the bot online 24/7 without you needing to worry about a thing ! https://distrobot.fr\n`,
  ];
  let idx = 0;
  const donate = () => console.log(messages[idx % 2]);
  setTimeout(() => {
    donate();
  }, 30_000);
  setInterval(() => {
    idx++;
    donate();
  }, 120_000);

  sync();
  setInterval(sync, 15_000);

  client.user!.setActivity(`Vinted BOT | v3 Docker 🐳`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  if (!adminIDs.includes(interaction.user.id))
    return void interaction.reply(
      `:x: You do not have the rights to perform this action !`
    );

  switch (interaction.commandName) {
    case "subscribe": {
      const sub: Partial<Subscription> = {
        url: interaction.options.getString("url")!,
        channelId: interaction.options.getChannel("channel")!.id,
        createdAt: new Date(),
        isActive: true,
      };
      if (sub.url?.includes("'search_text.....&'")) {
        console.log("please remove search_text");
        interaction.reply(`please remove search_text`);
        break;
      } else {
        sub.url = sub.url?.replaceAll(" ", "").replaceAll(`\n`, "");
        getConnection().manager.getRepository(Subscription).save(sub);
        interaction.reply(
          `:white_check_mark: Your subscription hass been successfully created !\n**URL**: <${sub.url}>\n**Salon**: <#${sub.channelId}>`
        );
        break;
      }
    }
    case "unsubscribe": {
      const subID = interaction.options.getString("id")!;
      const subscription = await getConnection()
        .manager.getRepository(Subscription)
        .findOne({
          isActive: true,
          id: parseInt(subID),
        });
      if (!subscription) {
        return void interaction.reply(
          ":x: No subscription found for your search..."
        );
      }
      getConnection().manager.getRepository(Subscription).update(
        {
          id: subscription.id,
        },
        {
          isActive: false,
        }
      );
      interaction.reply(
        `:white_check_mark: Subscription successfully deleted !\n**URL**: <${subscription.url}>\n**Salon**: <#${subscription.channelId}>`
      );
      break;
    }
    case "subscriptions": {
      const subscriptions = await getConnection()
        .manager.getRepository(Subscription)
        .find({
          isActive: true,
        });
      const chunks: string[][] = [[]];

      subscriptions.forEach((sub) => {
        const content = `**ID**: ${sub.id}\n**URL**: ${sub.url}\n**Salon**: <#${sub.channelId}>\n`;
        const lastChunk = chunks.shift()!;
        if (lastChunk.join("\n").length + content.length > 1024) {
          if (lastChunk) chunks.push(lastChunk);
          chunks.push([content]);
        } else {
          lastChunk.push(content);
          chunks.push(lastChunk);
        }
      });

      interaction.reply(
        `:white_check_mark: **${subscriptions.length}** subscriptions are active !`
      );

      chunks.forEach((chunk) => {
        const embed = new Discord.MessageEmbed()
          .setColor("RED")
          .setAuthor(`Use the /unsubscribe command to remove a subscription !`)
          .setDescription(chunk.join("\n"));

        interaction.channel!.send({ embeds: [embed] });
      });
    }
  }
});

client.login(process.env.VINTED_BOT_TOKEN);

function getReputationStars(reputationPercent: number) {
  let reputCalc = Math.round(reputationPercent / 0.2);
  let reputDemiCalc = reputationPercent % 0.2;

  let starsStr = "";

  for (let i = 0; i < reputCalc; i++) {
    starsStr += ":star:";
  }

  if (reputDemiCalc !== 0 && reputCalc < 5) {
    starsStr += " (+0.5)";
  }

  return starsStr;
}
