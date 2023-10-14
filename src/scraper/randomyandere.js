import CommandInteraction from 'modules/base';
import axios from 'axios';
import { JSDOM } from 'jsdom';

export default class RandomYandere extends CommandInteraction
{
    constructor(client)
    {
        super(client);
    }


    async onCommand(args, target, context, msg, self)
    {
        if (self) { return; }

        var tags = args.join(" ");

        // get amount of pages
        var url = "https://yande.re/post/index.xml?tags=" + tags + "&limit=1";
        try
        {
            var response = await axios.get(url);
        }
        catch (error)
        {
            this.client.say(target, "Error: " + error);
            return;
        }

        var dom = new JSDOM(response.data);
        var count = dom.window.document.querySelector("posts").getAttribute("count");
        var pages = Math.ceil(count / 200);

        var page = Math.floor(Math.random() * pages) + 1;

        var url = "https://yande.re/post.json?limit=200&page=" + page + "&tags=" + tags;
        try
        {
            var response = await axios.get(url);
        }
        catch (error)
        {
            this.client.say(target, "Error: " + error);
            return;
        }

        if (response.data.length == 0)
        {
            this.client.say(target, "@" + context.username + " No results found!");
            return;
        }

        var data = response.data[Math.floor(Math.random() * response.data.length)];
        var image_url = data.id;
        this.client.say(target, `@${context.username} https://yande.re/post/show/${image_url}`);
    }
}