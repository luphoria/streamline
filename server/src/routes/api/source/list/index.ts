import { createHandler } from "hono-file-router"
import { sourceModules } from "../../../../index"
import { Source } from "../../../../sources"

export const GET = createHandler(async (c) => {
    const sourceList: Partial<Source>[] = []
    for (const source of sourceModules) {
        const module = source[1]
        sourceList.push({
            Name: module.Name,
            friendlyName: module.friendlyName
        })
    }
    
    return c.json(sourceList);
})