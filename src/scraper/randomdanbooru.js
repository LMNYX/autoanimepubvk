import axios from 'axios';

export default class Danbooru
{
    constructor()
    {}

    async seek(args)
    {

        var tags = args.join(" ");

        var url = "https://danbooru.donmai.us/posts.json?limit=1&random=true&tags=" + tags;
        try
        {
            var response = await axios.get(url);
        }
        catch (error)
        {
            if (error.response.status == 422)
            {
                console.log("You can only use 1 tag.");
                return;
            }
            return;
        }

        if (response.data.length == 0)
        {
            console.log("No results found! :(");
            return;
        }

        var data = response.data[0];
        return data;
    }
}