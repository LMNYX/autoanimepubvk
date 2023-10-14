import axios from 'axios';

export default class Gelbooru
{
    async seek(args)
    {

        var tags = args.join(" ");

        var url = "https://gelbooru.com/index.php?page=dapi&s=post&q=index&limit=100&json=1&tags=" + tags;
        try
        {
            var response = await axios.get(url);
        }
        catch (error)
        {
            console.log(error);
            return false;
        }

        if (response.data.post == null || response.data.post.length == 0)
        {
            console.log("No results found.");
            return false;
        }

        var pages = response.data['@attributes'].count / 100;
        if (pages > 200)
            pages = Math.floor(Math.random() * 200);
        var page = Math.floor(Math.random() * pages);

        var url = "https://gelbooru.com/index.php?page=dapi&s=post&q=index&limit=100&json=1&tags=" + tags + "&pid=" + page;
        try
        {
            var response = await axios.get(url);
        }
        catch (error)
        {
            console.log("Error: " + error);
            return false;
        }
        if (response.data.post == undefined)
        {
            console.log("No results found.");
            return false;
        }

        var data = response.data.post[Math.floor(Math.random() * response.data.post.length)];
        return data;
    }
}