/*
 * Copyright (c) 2020 Pegasus Spiele Verlags- und Medienvertriebsgesellschaft mbH, all rights reserved.
 */

const { DmExecption } = require("../../utils");
const { MessageEmbed } = require("discord.js");

const QuizName = "SPIEL.digital";
const AnzahlFragen = 3;

exports.run = async (bot, msg) => {
  const SessionModel = bot.db.model("session");
  const VoucherModel = bot.db.model("voucher");
  const QuizModel = bot.db.model("quiz");

  const newSession = new SessionModel();
  newSession.userId = msg.author.id;
  newSession.status = "in progress";

  const closedSession = await SessionModel.find({ userId: newSession.userId, status: "closed" });
  if (closedSession.length != 0 && msg.channel.id !== bot.config.adminChannel) {
    throw new DmExecption("Du hast bereits schon eine Partie gespielt!", msg.author);
  }

  const activeSession = await SessionModel.find({ userId: newSession.userId, status: "in progress" });
  if (activeSession.length != 0) {
    throw new DmExecption("Du spielst schon eine Partie!", msg.author);
  }

  const quizzes = await QuizModel.find({ name: QuizName });
  if (quizzes.length == 0) {
    newSession.status = "error";
    await newSession.save();
    throw new DmExecption("Es konnten keine Fragen geladen werden... Bitte wende dich an einen Administrator!", msg.author);
  }

  newSession.quiz = quizzes[0];
  newSession.fragen = newSession.quiz.fragen.sort(() => Math.random() - Math.random()).slice(0, AnzahlFragen);

  const vouchers = await VoucherModel.find({ used: false });
  if (vouchers.length == 0) {
    newSession.status = "error";
    await newSession.save();
    throw new DmExecption("Es konnte kein Gutschein erzeugt werden... Bitte wende dich an einen Administrator!", msg.author);
  }

  await newSession.save();

  const filter = (reaction, user) => (reaction.emoji.name === "🇦" || reaction.emoji.name === "🇧" || reaction.emoji.name === "🇨") && user.id === msg.author.id;

  let winning = true;
  let counter = 0;

  for (const [index, frage] of newSession.fragen.entries()) {
    const quizEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setAuthor(msg.author.username)
      .setTitle(`${QuizName} - das Quiz!`)
      .addField(`Frage ${index + 1} von ${AnzahlFragen}`, frage.frage)
      .addField("🇦", frage.antworten[0])
      .addField("🇧", frage.antworten[1])
      .addField("🇨", frage.antworten[2])
      .addField("Richtige Antwort", ["🇦", "🇧", "🇨"][frage.richtig])
      .setTimestamp();

    const runningQuiz = await bot.users.cache.get(msg.author.id).send(quizEmbed);
    runningQuiz.react("🇦");
    runningQuiz.react("🇧");
    runningQuiz.react("🇨");

    runningQuiz
      .awaitReactions(filter, {
        max: 1,
      })
      .then(async (collected) => {
        const QuizAwnser = ["🇦", "🇧", "🇨"][frage.richtig];

        if (collected.array()[0].emoji.name !== QuizAwnser) winning = false;

        counter++;
        if (counter === AnzahlFragen) {
          if (winning) {
            newSession.status = "closed";
            newSession.won = true;
            bot.users.cache.get(newSession.userId).send("Du hast alle Fragen richtig beantwortet und gewonnen. Ein Gutscheincode wird dir gleich zugesandt!");
          } else {
            newSession.status = "closed";
            bot.users.cache.get(newSession.userId).send(`Du hast leider nicht gewonnen!`);
          }
          await newSession.save();
        }
      });
  }
};

exports.info = {
  name: "quiz",
  usage: "quiz",
  help: "Das Quiz zur SPIEL.digital.",
  unlock: 1603335600000, // Donnerstag, 22. Oktober 2020 05:00:00 GMT+02:00 https://www.epochconverter.com
};
