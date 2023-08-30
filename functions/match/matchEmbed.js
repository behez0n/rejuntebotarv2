const { getQueue } = require("../queue/queueHandler");
const {convertIDtoString, convertIDtoUserWithEmoji, convertIDtoUserWithEmojiElo} = require("../generalFunctions")
const {queueEmbed} = require("../queue/queueEmbeds")
const footer = "45s to vote";
const {EmbedBuilder} = require("discord.js");
const { getLastMatchId } = require('./matchHandler');
const config = require("../../config/config.json");
const emojisRoll = ["🔄"]
const errorTime = 45000;


function mapEmbed(message, emojis, maps) {
	var maplist = "";
	for (let index = 0; index < maps.length; index++) {
		maplist += `${emojis[index]} ${maps[index]}\n`
	}
	maplist += `${emojis[4]} Re roll maps`;
	
	const mapEmbed = new EmbedBuilder()
	.setColor('#04c779')
	.setTitle('Vote Map')
	.setDescription(`Maps:\n${maplist}`)
	.setFooter({ text: '45s to vote'})
	return mapEmbed;
}

function serverEmbed(message, emojis, servers) {
	var serverlist = "";
	for (let index = 0; index < servers.length; index++) {
		serverlist +=`${emojis[index]} ${servers[index]}\n`
	}
	const serverEmbed = new EmbedBuilder()
	.setColor('#04c779')
	.setTitle('Vote Server')
	.setDescription(`Server:\n${serverlist}`)
	.setFooter({ text: '45s to vote'})
	
	return serverEmbed;
}

function matchEmbedIncomplete(message, team1, team2, map){
    var cTeam1 = convertIDtoUserWithEmoji(message, team1);
    var cTeam2 = convertIDtoUserWithEmoji(message, team2);
    
	const fields = [
		{ name: '**Server**', value: "TFC Argieland" || 'Unknown Server' },
		{ name: '**Map**', value: map || 'Unknown Map' },
		{ name: '**🔴 Red Team**', value: cTeam1 || 'Unknown Red Team', inline: true },
		{ name: '**🔵 Blue Team**', value: cTeam2 || 'Unknown Blue Team', inline: true }
	  ];


    const matchEmbed = new EmbedBuilder()
		.setColor('#fca903')
		.setTitle('Pickup ready!')
		.addFields(fields)
		.setDescription('https://tinyurl.com/tfclatam2');
	message.channel.send({ embeds: [matchEmbed] })
}

function matchEmbed(message, team1, team2, server, map, id, shuffleteams) {
	var cTeam1 = convertIDtoUserWithEmoji(message, team1);
	var cTeam2 = convertIDtoUserWithEmoji(message, team2);
  	
	var cTeam1List = Array.isArray(cTeam1) ? cTeam1.join('\n') : cTeam1;
	cTeam1List = cTeam1List.replace(/, /g, '\n'); // Agrega saltos de línea después de cada coma y espacio
  
	var cTeam2List = Array.isArray(cTeam2) ? cTeam2.join('\n') : cTeam2;
	cTeam2List = cTeam2List.replace(/, /g, '\n'); // Agrega saltos de línea después de cada coma y espacio

	const fields = retrieveMatchFieldsForEmbed("TFC Argieland", map, cTeam1List, cTeam2List)

	const matchEmbed = retrieveMatchEmbedBuilder(fields);

	makeShuffleVotationWithCollector(matchEmbed, message, id, shuffleteams, true);
}

async function matchEmbedWithElo(message, team1, team2, server, map, id, shuffleteams) {
	var {users: cTeam1, rating: rTeam1, totalRating: trTeam1} = await convertIDtoUserWithEmojiElo(message, team1);
	var {users: cTeam2, rating: rTeam2, totalRating: trTeam2} = await convertIDtoUserWithEmojiElo(message, team2);
  	
	let cTeam1List = Array.isArray(cTeam1) ? cTeam1.join('\n') : cTeam1;
	cTeam1List = cTeam1List.replace(/, /g, '\n'); // Agrega saltos de línea después de cada coma y espacio
	cTeam1List += '\n**Total Rating**: '+ trTeam1;


	var cTeam2List = Array.isArray(cTeam2) ? cTeam2.join('\n') : cTeam2;
	cTeam2List = cTeam2List.replace(/, /g, '\n'); // Agrega saltos de línea después de cada coma y espacio
	cTeam2List += '\n**Total Rating**: '+ trTeam2;

	const fields = retrieveMatchFieldsForEmbed("TFC Argieland", map, cTeam1List, cTeam2List)
	
	const matchEmbed = retrieveMatchEmbedBuilder(fields);
	
	makeShuffleVotationWithCollector(matchEmbed, message, id, shuffleteams, false);
  }

  const retrieveMatchFieldsForEmbed = (server, map, team1, team2) => {
	return [
		//{ name: '**ID**', value: id},
		{ name: '**Server**', value: server || 'Unknown Server' },
		{ name: '**Map**', value: map || 'Unknown Map' },
		{ name: '**🔴 Red Team**', value: team1 || 'Unknown Red Team', inline: true },
		{ name: '**🔵 Blue Team**', value: team2 || 'Unknown Blue Team', inline: true }
	  ];
  }

  const retrieveMatchEmbedBuilder = (fields) => {
	return new EmbedBuilder()
	  .setColor('#fca903')
	  .setTitle('Pickup ready!')
	  .addFields(fields)
	  .setDescription('https://tinyurl.com/tfclatam2');
  }

  const makeShuffleVotationWithCollector = (matchEmbed, message, id, shuffleteams, eloshuffle) => {
	message.channel.send({ embeds: [matchEmbed] }).then(embedMessage => {
		if(eloshuffle)
		{
			embedMessage.react(emojisRoll[0])
		}

		let usersStored = [];
		let votes = [0];
		const filter = (reaction, user) =>{
			return emojisRoll.includes(reaction.emoji.name) && user.id !==embedMessage.author.id && bothTeams.includes(user.id) && !usersStored.includes(user.id);
		};
		const collector = embedMessage.createReactionCollector({ filter, max: config.matchsize, time: errorTime, errors: ['time'] });

		collector.on('collect', (reaction, user) => {
			if(reaction.emoji.name === `${emojisRoll[0]}`)
			{
				votes[0]++;
			}
			usersStored.push(user.id);
		});
		collector.on('end', collected => {
			if(votes[0] >= (config.matchsize/2) ){
				embedMessage.delete();
				shuffleteams(message, id)
				return;
			}else{
				embedMessage.reactions.removeAll();
			}	
		})
	});
  }

  
  module.exports = { matchEmbed, serverEmbed, mapEmbed, matchEmbedIncomplete, matchEmbedWithElo };
  