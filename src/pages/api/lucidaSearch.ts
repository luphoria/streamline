// Search lucida with `${ARTIST} - ${TITLE}` to get the streaming service URL.
// TODO: beyond demo, this should not be exposed as an API; rather, internally, the server should be parsing all of this within one `search` query.
export async function GET({ params, request }) {
  const url = new URL(request.url);

  const searchParams = new URLSearchParams(url.search);

  const query = encodeURIComponent(searchParams.get("query"));
  let streamingService = "tidal"; // Should be a parameter.

  const REQ_URL = `https://lucida.su/api/load?url=%2Fapi%2Fsearch%3Fquery%3D${encodeURIComponent(query)}%26service%3D${streamingService}%26country%3DUS`;
  console.info(REQ_URL);

  let response = await fetch(REQ_URL);

  let data = await response.text();

  return new Response(data);
}
