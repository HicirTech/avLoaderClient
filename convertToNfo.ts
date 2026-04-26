import { elementMapper } from "./elementMapper.ts";

const converToNfo = async (json: { [key: string]: string[] | string }) => {
    const targetTags = [] as string[];
    if (!json["翻译标题"]) {
        json["翻译标题"] = json["原标题"];
    }

    Object.keys(elementMapper).map((key) => {
        if (json[key] && JSON.stringify(json[key]) != JSON.stringify([])) {
            const to = elementMapper[key];
            switch (key) {
                case "原标题":
                case "翻译标题":
                    {
                        const title = (json[key] as string).trim();
                        const title_id = (json["番號"][0] as string).trim();
                        targetTags.push(`<${to}>[${title_id}]${title}</${to}>`);
                        break;
                    }
                case "日期":
                case "片商":
                case "评分":
                case "导演":
                    targetTags.push(`<${to}>${json[key][0]}</${to}>`);
                    break;
                case "類別":
                    {
                        const listOfItems = json[key] as string[];
                        listOfItems.map((item) => {
                            targetTags.push(`<${to}>${item}</${to}>`);
                        });
                    }
                    break;
                case "演員": {
                    const listOfActor = json[key] as string[];
                    listOfActor.map((item) => {
                        targetTags.push(`<actor><name>${item}</name><role></role><order></order></actor>`);
                    });
                }
            }
        }
    });

    return targetTags.join("\n");
};

export { converToNfo }