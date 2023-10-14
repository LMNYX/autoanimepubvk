import dotenv from 'dotenv';
dotenv.config();
import { VK } from 'vk-io';
import { OutputFormatter } from 'utilities/output';
import Gelbooru from 'scraper/randomgelbooru';
import axios from 'axios';
import wiki from 'wikipedia';
var blessed = require('blessed');
import { wikiSummary, summaryError } from 'wikipedia';
import { summary } from 'wikipedia';
import { screen } from 'blessed';

const _screen = blessed.screen({
    smartCSR: true,
    dockBorders: true
});

_screen.title = 'my window title';

const box = blessed.box({
    top: 'left',
    left: 'left',
    width: '100%',
    height: '98%',
    content: '{cyan-fg}MOTD: Live, love the weebs!{/cyan-fg}',
    tags: true,
    border: {
        type: 'line'
    },
    style: {
        fg: 'white',
        bg: 'black',
        border: {
            fg: '#f0f0f0'
        }
    },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
        ch: ' ',
        track: {
            bg: 'cyan'
        }
    }
});

// add a box at the bottom of the screen that will have input text.
const input = blessed.textbox({
    bottom: 0,
    left: 0,
    height: 1,
    width: '100%',
    keys: true,
    inputOnFocus: true,
    style: {
        fg: 'white',
        bg: 'black',
        border: {
            fg: '#f0f0f0'
        }
    }
});

input.on('submit', function(value) {
    handleCommand(value);
    input.clearValue();
    _screen.render();
    input.focus();
}
);

_screen.append(input);
box.setLabel(' Output ');

_screen.append(box);

_screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});


formatAddAndOutput("Starting the client...");

const vk = new VK({
    token: process.env.VK_TOKEN
});
var gelbooru = new Gelbooru();

wiki.setLang('ru');

var GENERAL_FORBIDDEN_TAGS = ["-yaoi", "-futanari", "-comic", "-furry", "-bestiality"];
var NSFW_FORBIDDEN_TAGS = ["-pokemon", "-loli"];
var SFW_FORBIDDEN_TAGS = ["-nipples", "-nude"];

const DESCRIPTION = `сырные шарики. это все он постит, а не я.
SFW - @autoanime
NSFW - @autoanimensfw

Запрещенные теги (везде):
${GENERAL_FORBIDDEN_TAGS.filter(x => x.startsWith("-") && x != "-futanari").join(', ')}

Запрещенные теги (SFW):
${SFW_FORBIDDEN_TAGS.filter(x => x.startsWith("-") && x != "-futanari").join(', ')}

Запрещенные теги (NSFW):
${NSFW_FORBIDDEN_TAGS.filter(x => x.startsWith("-") && x != "-futanari").join(', ')}`;

async function SeekNewPost (isExplicit)
{
    var group_id = isExplicit ? process.env.VK_GROUP_UNSAFE_ID : process.env.VK_GROUP_SAFE_ID;
    var tags = ["-animated", "highres", isExplicit ? "rating:explicit" : "-rating:explicit"];
    if (isExplicit)
        tags.push(...NSFW_FORBIDDEN_TAGS);
    else
        tags.push(...SFW_FORBIDDEN_TAGS);
    tags.push(...GENERAL_FORBIDDEN_TAGS);
    var data = await gelbooru.seek(tags);
    if (data.rating == "explicit" && !isExplicit)
    {
        return await SeekNewPost(isExplicit);
    }
    if (data)
    {
        var parsedData = {
            "id": data.id,
            "file_url": data.file_url,
            "source": data.source ? data.source : null,
            "tags": data.tags,
        };

        parsedData.tags = parsedData.tags.replace(/[^a-zA-Z0-9 _]/g, "_");
        parsedData.tags = "#" + parsedData.tags.replace(/ /g, " #");

        var image = await axios.get(parsedData.file_url, { responseType: 'arraybuffer' });
        var buffer = Buffer.from(image.data, 'binary');


        var upload = await vk.upload.wallPhoto({
            source: {
                value: buffer,
                filename: 'image.png'
            },
            group_id: group_id,
            caption: parsedData.tags
        });
        try
        {
            var randomNews = await GetRandomNews();
        }
        catch (e)
        {
            formatAddAndOutput(e.message);
            return await SeekNewPost(isExplicit);
        }

        var msg = `${randomNews.title}\n\n${randomNews.description ? randomNews.description : ""}`;
        var post = await vk.api.wall.post({
            owner_id: -group_id,
            from_group: 1,
            attachments: upload.toString(),
            copyright: parsedData.source ? parsedData.source : "",
            message: msg
        });

        formatAddAndOutput("Posted to vk. (" + (isExplicit ? "NSFW" : "SFW") + ")");

    }
};

async function GetRandomNews()
{
    var req = await wiki.random();
    var page = await wiki.page(req.title);
    var page = await page.summary();
    var data = {
        "title": page.title,
        "description": page.extract
    };
    return data;
}

async function AcceptJoin(group_id)
{
    var join = await vk.api.groups.getRequests({
        group_id: group_id,
        count: 200
    });
    if (join.items.length > 0)
    {
        for (var i = 0; i < join.items.length; i++)
        {
            var user_id = join.items[i];
            var accept = await vk.api.groups.approveRequest({
                group_id: group_id,
                user_id: user_id
            });
        }
    }
}

async function AppointAdmin(group_id, user_id) // debug
{
    var appoint = await vk.api.groups.editManager({
        group_id: group_id,
        user_id: user_id,
        role: "administrator"
    });
}

async function SetStatus(group_id, status)
{
    var set = await vk.api.status.set({
        group_id: group_id,
        text: status
    });
}

// set group's description
async function SetDescription(group_id, description)
{
    var set = await vk.api.groups.edit({
        group_id: group_id,
        description: description
    });
}

var DELAY = 3600000;

async function Loop()
{
    _screen.render();
    try
    {
        await SeekNewPost(false);
        await SeekNewPost(true);
        formatAddAndOutput(`Next post will be posted at ${new Date(Date.now() + DELAY / 2).toLocaleString()}`);
        await sleep(DELAY / 2);
    } catch (e)
    {
        formatAddAndOutput("ERROR: " + e.message);
        await Loop(3000);
    }
    Loop();
}

async function Setup()
{
    // deprecated
}

async function sleep(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatAddAndOutput(message, worker)
{
    if (worker == undefined)
        worker = "worker";

    if (typeof message == "string")
        message = OutputFormatter.Log(worker, message);
    else
        message = OutputFormatter.Log(worker, ...message);
    box.insertBottom(message);
    _screen.render();
}

console.log = formatAddAndOutput;

_screen.render();
setInterval(AcceptJoin, 65000, process.env.VK_GROUP_UNSAFE_ID);
Loop();

async function handleCommand(command)
{
    let cmd = command.split(' ')[0];
    let args = command.split(' ').slice(1);

    switch(cmd)
    {
        case "forcepost":
            if (args.length < 1)
            {
                formatAddAndOutput("Usage: forcepost <nsfw/sfw>");
                break;
            }
            try
            {
                await SeekNewPost(args[0] == "nsfw");
            } catch (e)
            {
                formatAddAndOutput("ERROR: " + e.message);
            }
            break;
        case "delay":
            if (args.length < 1)
            {
                formatAddAndOutput(`Current delay: ${DELAY / 1000} seconds.`, 'debug');
                break;
            }
            DELAY = args[0] * 1000;
            formatAddAndOutput(`Set delay to ${DELAY / 1000} seconds.`, 'debug');
            break;
        case "tags":
            if (args.length < 2)
            {
                formatAddAndOutput(`SFW: ${SFW_FORBIDDEN_TAGS.join(', ')}`, 'debug');
                formatAddAndOutput(`NSFW: ${NSFW_FORBIDDEN_TAGS.join(', ')}`, 'debug');
                formatAddAndOutput(`GENERAL: ${GENERAL_FORBIDDEN_TAGS.join(', ')}`, 'debug');
                break;
            }

            switch(args[0])
            {
                case "add":
                    switch(args[1])
                    {
                        case "sfw":
                            SFW_FORBIDDEN_TAGS.push(args[2]);
                            formatAddAndOutput(`Added ${args[2]} to SFW tags.`, 'debug');
                            break;
                        case "nsfw":
                            NSFW_FORBIDDEN_TAGS.push(args[2]);
                            formatAddAndOutput(`Added ${args[2]} to NSFW tags.`, 'debug');
                            break;
                        case "general":
                            GENERAL_FORBIDDEN_TAGS.push(args[2]);
                            formatAddAndOutput(`Added ${args[2]} to GENERAL tags.`, 'debug');
                            break;
                        default:
                            break;
                    }
                    break;
                case "remove":
                    switch(args[1])
                    {
                        case "sfw":
                            SFW_FORBIDDEN_TAGS = SFW_FORBIDDEN_TAGS.filter(x => x != args[2]);
                            formatAddAndOutput(`Removed ${args[2]} from SFW forbidden tags.`, 'debug');
                            break;
                        case "nsfw":
                            NSFW_FORBIDDEN_TAGS = NSFW_FORBIDDEN_TAGS.filter(x => x != args[2]);
                            formatAddAndOutput(`Removed ${args[2]} from NSFW forbidden tags.`, 'debug');
                            break;
                        case "general":
                            GENERAL_FORBIDDEN_TAGS = GENERAL_FORBIDDEN_TAGS.filter(x => x != args[2]);
                            formatAddAndOutput(`Removed ${args[2]} from GENERAL forbidden tags.`, 'debug');
                            break;
                        default:
                            break;
                    }
                    break;
                default:
                    break;
            }
            break;
        case "quit":
        case "exit":
            process.exit(0);
            break;
        default: break;
    }
}