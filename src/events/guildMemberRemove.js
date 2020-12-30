/*
 * Copyright (c) 2020 - 2021 Pegasus Spiele Verlags- und Medienvertriebsgesellschaft mbH, all rights reserved.
 */

const { MessageEmbed } = require("discord.js");

exports.run = (bot, member) => {
  const embed = new MessageEmbed().setTitle(`${member.user.tag} hat gerade den Server verlassen.`);

  bot.channels.resolve(bot.config.goodbyeChannel).send(embed);
};
