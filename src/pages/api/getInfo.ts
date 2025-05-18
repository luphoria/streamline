import JSON5 from "json5";

export async function GET({ params, request }) {
	const url = new URL(request.url);

	const searchParams = new URLSearchParams(url.search);

	const searchUrl = searchParams.get("url");

	const response = await fetch(
		`https://lucida.su/?url=${searchUrl}&country=US`
	);

	let data = await response.text();

	data = data.split("const data = [null,")[1].split("];")[0];

	data = JSON5.parse(data);

	return new Response(JSON.stringify(data));
}
