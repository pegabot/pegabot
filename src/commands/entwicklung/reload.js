/*
 * Copyright (c) 2020 - 2021 The Pegabot authors
 * This code is licensed under MIT license (see LICENSE for details)
 */

const path = require("path");
const { BotExecption } = require("../../utils");

module.exports = {
  name: "reload",
  usage: "reload <command>",
  help: "Lädt ein übergebenen Command neu.",
  owner: true,
  execute: (bot, msg, args) => {
    if (args.length < 1) throw new BotExecption("Du musst ein Command zum Neuladen übergeben.");

    if (!bot.commands.has(args[0])) throw new BotExecption(`Der Command ${args[0]} existiert nicht.`);

    const cmdPath = bot.commands.get(args[0]).path;
    const relativePath = path.join("..", bot.commands.get(args[0]).path);
    delete require.cache[require.resolve(relativePath)];
    bot.commands.delete(args[0]);
    const cmd = require(relativePath);
    cmd.path = cmdPath;
    bot.commands.loadCommand(args[0], cmd);
    msg.channel.send(`Der Command \`${args[0]}\` wurde neu geladen.`);
  },
};
