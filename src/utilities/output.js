import 'colors';

export default class Output
{
    static Log(sender="worker", ...message)
    {
        if(message.length < 1) console.log(`${"[log]".cyan}[sys] ${sender}`)
        else console.log(`${"[log]".cyan}[${sender}] ${message.join(" ")}`);
    }
    static Warn(sender="worker", ...message)
    {
        if(message.length < 1) console.log(`${"[wrn]".yellow}[sys] ${sender}`)
        else console.log(`${"[wrn]".yellow}[${sender}] ${message.join(" ")}`);
    }
    static Error(sender="worker", ...message)
    {
        if(message.length < 1) console.log(`${"[err]".red}[sys] ${sender}`)
        else console.log(`${"[err]".red}[${sender}] ${message.join(" ")}`);
    }
    static Unformatted(...message)
    {
        console.log(...message);
    }
}

export class OutputFormatter
{
    static Log(sender="worker", ...message)
    {
        if(message.length < 1) return (`${"[log]".cyan}[sys] ${sender}`)
        else return (`${"[log]".cyan}[${sender}] ${message.join(" ")}`);
    }
    static Warn(sender="worker", ...message)
    {
        if(message.length < 1) return(`${"[wrn]".yellow}[sys] ${sender}`)
        else return(`${"[wrn]".yellow}[${sender}] ${message.join(" ")}`);
    }
    static Error(sender="worker", ...message)
    {
        if(message.length < 1) return(`${"[err]".red}[sys] ${sender}`)
        else return(`${"[err]".red}[${sender}] ${message.join(" ")}`);
    }
    static Unformatted(...message)
    {
        return [...message].join();
    }
}

export class PresetOutput
{
    constructor(name)
    {
        this.name = name;
    }

    Log(...message)
    {
        Output.Log(this.name, ...message);
    }
    Warn(...message)
    {
        Output.Warn(this.name, ...message);
    }
    Error(...message)
    {
        Output.Error(this.name, ...message);
    }
}