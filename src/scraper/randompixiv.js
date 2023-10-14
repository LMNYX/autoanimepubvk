import CommandInteraction from 'modules/base';
import axios from 'axios';

export default class RandomPixiv extends CommandInteraction {
    constructor(client) {
        super(client);
    }


    async onCommand(args, target, context, msg, self) {
        if (self) { return; }

        var tags = args.join(" ");

        var url = "https://www.pixiv.net/ajax/search/artworks/" + tags + "?word=" + tags + "&order=date_d&mode=all&p=1&s_mode=s_tag&type=all&lang=en";

        try {
            var response = await axios.get(url);
        }
        catch (error) {
            if (error.response.status == 400) {
                this.client.say(target, "For pixiv, you need to provide a tag. Example: !pixiv touhou");
                return;
            }
            this.client.say(target, "Error: " + error);
            return;
        }

        if (response.data.body.length == 0) {
            this.client.say(target, "@" + context.username + " No results found!");
            return;
        }

        var data = response.data.body['illustManga']['data'];
        
        if (data.length == 0) {
            this.client.say(target, "@" + context.username + " No results found!");
            return;
        }

        // get random
        var random = Math.floor(Math.random() * data.length);
        var image_url = data[random].id;
        this.client.say(target, `@${context.username} https://www.pixiv.net/en/artworks/${image_url}`);
    }
}