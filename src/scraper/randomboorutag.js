import axios from 'axios';

export default class RandomBooruTag
{
    constructor()
    {}

    async get_tags()
    {
        this.tags = [];
        var url = "https://yande.re/tag.json?limit=100000";
        try
        {
            var response = await axios.get(url);
        }
        catch (error)
        {
            return;
        }

        if (response.data.length == 0)
        {
            return;
        }

        this.tags = response.data.map(x => { return { "name": x.name, "count": x.count }; });
        return this.tags;
    }
}