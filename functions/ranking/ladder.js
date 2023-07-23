const { retrieveConnection } = require('../database/database')
const { EmbedBuilder } = require('discord.js');

let ladderMessage = null;

async function showLadder(discordClient) {
    let con = await retrieveConnection();
    const playersQuery = "SELECT p.Nickname,r.Position, r.Win, r.Lose, r.Tie from players p, ranking r WHERE p.SteamID = r.SteamID ORDER BY r.Position;"
    con.query(playersQuery, async (err, result) => {
        if (err) {
            console.log(err);
            return;
        }

        let playerList = '';
        result.forEach(e => {
            if (e.Position === null) {
                return;
            }
            playerList += `${e.Position.toString() || 'Unknown Position'} - ${e.Nickname || 'Unknown Player'} (${e.Win.toString()} | ${e.Lose.toString()} | ${e.Tie.toString()})\n`;
        });

        const ladderEmbed = new EmbedBuilder()
            .setColor('#fca903')
            .setTitle('Ranking TFC.latam')
            .setDescription(playerList)
            .setFooter({ text: 'Stats: (Win|Lose|Tie)' });

        

        const sendDiscordMessage = async (ladderEmbed) => {
            try {
                let channelId = "1128808340793868410"
                const rankingChat = discordClient.channels.cache.get(channelId);
                rankingChat.send({
                    embeds: [ladderEmbed]
                }).then(msg => ladderMessage = msg).catch(console.error)
            } catch (err) {
                console.error(`Unable to retrieve ranking channel ${err}`)
            }
        }


        //TODO: check if message exists before sending/editing
        if (ladderMessage) {
            ladderMessage.edit({ embeds: [ladderEmbed] })
                .catch((err) => {
                    console.error(err)
                    //Probably the message was deleted by an user
                    sendDiscordMessage(ladderEmbed);
                });
        } else {
            sendDiscordMessage(ladderEmbed);
        }
    });
}
async function getLadder(message, client) {
    await showLadder(client);
    message.author.send("Ranking ladder was updated at #ranking channel");
}



async function calculateLadder() {
    let con = await retrieveConnection();
    let rankingQuery = "SELECT * FROM ranking";
    con.query(rankingQuery, (err, res) => {
        if (err) {
            let error = `error retrieving ranking list ${err}`
            console.log(error)
            return;
        }

        res.sort((a, b) => {
            // Ordenar por número de victorias (mayor a menor)
            if (a.Win > b.Win) return -1;
            if (a.Win < b.Win) return 1;

            // Ordenar por número de empates (mayor a menor)
            if (a.Tie > b.Tie) return -1;
            if (a.Tie < b.Tie) return 1;

            // Ordenar por número de derrotas (menor a mayor)
            if (a.Lose < b.Lose) return -1;
            if (a.Lose > b.Lose) return 1;
        })
        res.forEach((r, i) => {
            const getResultsQuery = `UPDATE tfc.ranking SET Position = ${i + 1} where SteamID = '${r.SteamID}';`;
            con.query(getResultsQuery, (err) => {
                if (err) {
                    let error = `Error on update ranking position ${err}`
                    console.log(error);
                }
            })
        })
    })
}



module.exports = { showLadder, calculateLadder, getLadder }