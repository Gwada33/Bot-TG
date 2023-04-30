const fs = require('fs');
const { Client, Intents, MessageEmbed, MessageAttachment} = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const { token } = require('./config.json');
const xml2js = require('xml2js');

const bannedWords =  ['tg', 't g', 't.g', 't_g', 't#g', 't@ g', 't@g', 'tèg', 'tèj', 'tageule', 'ta gueule', 'ta gueue', 'ta geule', 'tageule', 'ta geule', 'ta guel', 'tagel', 'ta gueuleee', 'tageuleee', 't g e u l e', 't.g.e.u.l.e', 't_g_e_u_l_e', 't#g#e#u#l#e', 't@g@e@u@l@e', 't-g-e-u-l-e', 't.e.g.e.u.l.e', 't_e_g_e_u_l_e', 'TG', 'T G', 'T.G', 'T_G', 'T#G', 'T@ G', 'T@G', 'TÈG', 'TÈJ', 'TAGEULE', 'TA GUEULE', 'TA GUEUE', 'TA GEULE', 'TAGEULE', 'TA GEULE', 'TA GUEL', 'TAGEL', 'TA GUEULEEE', 'TAGEULEEE', 'T G E U L E', 'T.G.E.U.L.E', 'T_G_E_U_L_E', 'T#G#E#U#L#E', 'T@G@E@U@L@E', 'T-G-E-U-L-E', 'T.E.G.E.U.L.E', 'T_E_G_E_U_L_E', 'f tg', 'F TG', 'F.TG', 'F_TG', 'F#TG', 'F@ TG', 'F@TG', 'FÈTG', 'FÈJ', 'FAGEULE', 'FA GUEULE', 'FA GUEUE', 'FA GEULE', 'FAGEULE', 'FA GEULE', 'FA GUEL', 'FAGEL', 'FA GUEULEEE', 'FAGEULEEE', 'F G E U L E', 'F.G.E.U.L.E', 'F_G_E_U_L_E', 'F#G#E#U#L#E', 'F@G@E@U@L@E', 'F-G-E-U-L-E', 'F.E.G.E.U.L.E', 'F_E_G_E_U_L_E']


let users = {};

var leaderboard = new SlashCommandBuilder()
.setName('leaderboard')
.setDescription('Leaderboard commands to show the "tg" word present')


var stats = new SlashCommandBuilder()
.setName('stats')
.setDescription('Stats commands to show the stats coefficient stats')


var reset = new SlashCommandBuilder()
.setName('reset')
.setDescription('Reset commands to reset stats')


if (fs.existsSync('./users.xml')) {
  const parser = new xml2js.Parser();
  const data = fs.readFileSync('./users.xml');
  parser.parseStringPromise(data).then(result => {
    users = result.users ? result.users.user.reduce((obj, item) => {
      obj[item._id] = item;
      return obj;
    }, {}) : {};
  });
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.application.commands.create(leaderboard)
  client.application.commands.create(stats)
  client.application.commands.create(reset)
});

  

  const dayjs = require('dayjs');
  const relativeTime = require('dayjs/plugin/relativeTime');
  dayjs.extend(relativeTime);
  require('dayjs/locale/fr');
  dayjs.locale('fr');
  
  client.on('messageCreate', async message => {
    if (message.author.bot) return;
  
    const messageContent = message.content.toLowerCase();
  
    for (const word of bannedWords) {
      if (messageContent.includes(word)) {
        const userId = message.author.id;
        const now = Date.now();
        const user = users[userId]
          ? {
              ...users[userId],
              _username: message.author.username.toString(),
              _count: Number(users[userId]._count) + 1,
              _lastUsed: now,
            }
          : {
              _id: userId,
              _username: message.author.username.toString(),
              _count: 1,
              _lastUsed: now,
            };
        users[userId] = user;
  
        const builder = new xml2js.Builder();
        const xml = builder.buildObject({ users: { user: Object.values(users) } });
        fs.writeFileSync('./users.xml', xml);
  
        const embed = new MessageEmbed()
          .setColor('#FF0000')
          .setTitle(`Attention ${message.author.username} !`)
          .setDescription(`Vous avez dit "${word}" **${user._count}** fois.`)
          
  
        message.reply({ embeds: [embed] });
        break;
      }
    }
  });
  
  client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() || interaction.commandName !== 'leaderboard') return;
  
    const data = fs.readFileSync('./users.xml');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(data);
    const users = result.users ? result.users.user : {};
    let leaderboardData = Object.entries(users)
      .map(([key, value]) => {
        return { id: value._id, username: value._username, count: Number(value._count), lastUsed: Number(value._lastUsed) };
      });
  
    if (!leaderboardData || !Array.isArray(leaderboardData)) {
      interaction.reply('Aucune donnée de classement trouvée.');
      return;
    }
  
    leaderboardData = leaderboardData.reduce((acc, cur) => {
      const existingUserIndex = acc.findIndex(user => user.username === cur.username);
      if (existingUserIndex === -1) {
        acc.push(cur);
      } else {
        acc[existingUserIndex].count += cur.count;
        acc[existingUserIndex].lastUsed = Math.max(acc[existingUserIndex].lastUsed, cur.lastUsed);
      }
      return acc;
    }, []);
  
    leaderboardData = leaderboardData.sort((a, b) => b.count - a.count);
  
    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`Classement des utilisateurs ayant le plus utilisé le mot "${bannedWords[0]}"`)
      .addFields(
        leaderboardData.map((user, index) => {
          return {
            name: `${index + 1}. ${user.username}`,
            value: `${user.count} fois, dernière utilisation **${dayjs(user.lastUsed).fromNow()}**`,
          };
        })
      );
  
    interaction.reply({ embeds: [embed] });
  });

const { readFile } = require('fs/promises');

  
const axios = require('axios');


client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() || interaction.commandName !== 'stats') return;
  
    const data = await readFile('./users.xml');
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(data);
    const users = result.users ? result.users.user : [];
  
    if (users.length === 0) {
      interaction.reply('Aucune donnée utilisateur trouvée.');
      return;
    }
  
    const counts = users.map(user => Number(user._count));
    const maxCount = Math.max(...counts);
  
    const chartData = {
      type: 'bar',
      data: {
        labels: users.map(user => user._username),
        datasets: [
          {
            label: 'Utilisations',
            data: counts,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ]
      }
    };
  
    const config = {
      method: 'get',
      url: `https://quickchart.io/chart?c=${JSON.stringify(chartData)}`,
      responseType: 'arraybuffer'
    };
  
    const response = await axios(config);
    const attachment = response.data;
  
    const embed = new MessageEmbed()
      .setColor('#0099ff')
      .setTitle('Statistiques d\'utilisation')
      .setDescription('Nombre d\'utilisations de chaque utilisateur')
      .setImage('attachment://chart.png');
  
    const file = new MessageAttachment(attachment, 'chart.png');
    const message = { embeds: [embed], files: [file] };
  
    try {
      const sentMessage = await interaction.reply(message);
      const chartURL = `https://quickchart.io/chart?c=${JSON.stringify(chartData)}`;
      console.log(chartURL);
    } catch (error) {
      console.error(error);
      interaction.reply('Erreur lors de l\'envoi de l\'embed.');
    }
  });

  client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() || interaction.commandName !== 'reset') return;
  
    // Vérifier les permissions de l'utilisateur
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      const embed = new MessageEmbed()
        .setColor('#FF0000')
        .setTitle('Erreur de permission')
        .setDescription('Vous devez avoir les permissions d\'administrateur pour utiliser cette commande.');
  
      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  
    // Récupérer l'argument "logs"
    const logsOption = interaction.options.get('logs');
    const writeLogs = logsOption ? logsOption.value : false;
  
    for (const userId in users) {
      users[userId]._count = 0;
      users[userId]._lastUsed = null;
    }
  
    const builder = new xml2js.Builder();
    const xml = builder.buildObject({ users: { user: Object.values(users) } });
    fs.writeFileSync('./users.xml', xml);
  
    const embed = new MessageEmbed()
      .setColor('#00FF00')
      .setTitle('Statistiques réinitialisées')
      .setDescription('Les statistiques de tous les utilisateurs ont été réinitialisées.');
  
    await interaction.reply({ embeds: [embed] });
  
    // Écrire les logs dans un fichier XML
    if (writeLogs) {
      const logFilePath = './logs/logs.xml';
  
      // Vérifier si le dossier logs existe
      if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
      }
  
      // Vérifier si le fichier de logs existe
      let logXml = '';
      if (fs.existsSync(logFilePath)) {
        const logXmlData = fs.readFileSync(logFilePath, 'utf8');
        const logXmlObj = await xml2js.parseStringPromise(logXmlData);
        logXml = builder.buildObject(logXmlObj);
      } else {
        logXml = builder.buildObject({ logs: [] });
      }
  
      // Ajouter le nouveau log
      const newLog = {
        userTag: interaction.user.tag,
        userId: interaction.user.id,
        date: new Date().toLocaleString()
      };
      logXml.logs.log.push(newLog);
  
      // Écrire le nouveau fichier de logs
      const newLogXml = builder.buildObject(logXml);
      fs.writeFileSync(logFilePath, newLogXml);
    }
  });
  
  
  
client.login(token);