import slskSearch from "../sources/slsk";

export async function GET({ request }) {
    const url = new URL(request.url);

    const searchParams = new URLSearchParams(url.search);

    const query = decodeURIComponent(searchParams.get("query"));
    //TODO: make this actually do something (when we have multiple sources ofc)
    const source = decodeURIComponent(searchParams.get("source")) || "slsk"
    
    return await slskSearch(query);
}